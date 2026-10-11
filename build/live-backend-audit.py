#!/usr/bin/env python3
"""Read-only Firebase audit for the checked-out GitHub release SHA.
Fail closed: no IAM mutation, deploy, Secret Manager, database-document or storage-object read.
A locked previously deployed backend source baseline is checked separately.
"""
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.request

P = "fidunio-fef13"
N = "130339622893"
REGION = "us-central1"
BASELINE = "d4117a3a9f72e0598628676dc8c41d4d501cd016"
IOS_APP = "1:130339622893:ios:929f4e431c91ef7ed0e1e4"
WEB_APP = "1:130339622893:web:912a9016e294b30dd0e1e4"
EXPECTED = {
 "enrollRecoveryV1":"recovery","startE2EERecoveryV1":"recovery",
 "completeE2EERecoveryV1":"recovery","createAdminRecoveryAuthorizationV1":"recovery",
 "listAdminRecoveryAuthorizationsV1":"recovery","revokeAdminRecoveryAuthorizationV1":"recovery",
 "startAdminAuthorizedRecoveryV1":"recovery","completeAdminAuthorizedRecoveryV1":"recovery",
 "getLegalAcceptanceV1":"recovery","acceptLegalPolicyV1":"recovery",
 "getMyAccountDeletionRequestV1":"message-delete","requestMyAccountDeletionV1":"message-delete",
 "markMyAccountDeletionCleanupCompleteV1":"message-delete",
 "cancelMyAccountDeletionRequestV1":"message-delete","completeMyAccountDeletionV1":"message-delete",
 "transferSystemOwnershipV1":"recovery",
 "deleteDirectMessageForEveryoneV1":"message-delete",
 "deleteMyMessagesForEveryoneV1":"message-delete",
 "deleteConversationForEveryoneV1":"message-delete",
 "notifyDirectMessageCreatedV1":"notification","notifyGroupMessageCreatedV1":"notification",
 "purgeDisappearingMessagesV1":"disappearing-purge",
 "claimNotificationLeaseV1":"notification","revokeNotificationLeaseV1":"notification",
}
SERVICE_ACCOUNTS = {
 "recovery":f"fidunio-recovery@{P}.iam.gserviceaccount.com",
 "message-delete":f"fidunio-message-delete@{P}.iam.gserviceaccount.com",
 "notification":f"fidunio-notification@{P}.iam.gserviceaccount.com",
 "disappearing-purge":f"fidunio-disappearing-purge@{P}.iam.gserviceaccount.com",
}
ALLOW_ENV = {"FIREBASE_CONFIG","GCLOUD_PROJECT","EVENTARC_CLOUD_EVENT_SOURCE",
 "LOG_EXECUTION_ID","FUNCTION_TARGET","FUNCTION_SIGNATURE_TYPE","K_SERVICE",
 "K_REVISION","K_CONFIGURATION","PORT","GOOGLE_NODE_RUN_SCRIPTS","FUNCTION_REGION"}
root = pathlib.Path.cwd()
sha = os.environ.get("GITHUB_SHA", "").strip()
if not re.fullmatch(r"[0-9a-f]{40}", sha):
    raise SystemExit("BLOCK: exact GITHUB_SHA unavailable")
def run(*args):
    p = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode:
        raise RuntimeError(f"Command failed: {args[0]} {args[1] if len(args)>1 else ''}: {p.stderr[:400]}")
    return p.stdout.strip()
def digest(raw):
    return hashlib.sha256(raw).hexdigest()
def require(cond, message):
    if not cond: raise RuntimeError("BLOCK: " + message)
require(run("git","rev-parse","HEAD")==sha,"checkout does not match event SHA")
# An independently released and audited backend-source baseline. No false source
# parity claim is possible from Cloud Functions viewer metadata alone.
run("git","cat-file","-e",BASELINE+"^{commit}")
p = subprocess.run(["git","diff","--quiet",BASELINE,sha,"--","functions/"],cwd=root)
require(p.returncode==0,"backend source changed since certified deployment baseline; new deployment attestation needed")
token = run("gcloud","auth","print-access-token")
def api(url):
    req=urllib.request.Request(url,headers={"Authorization":"Bearer "+token,"Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=30) as response:
        require(response.status==200,"read failed for "+url)
        return json.load(response)
report={"sha":sha,"project":P,"baseline":BASELINE,"rules":{},"functions":{},"appCheck":{}}
releases=api(f"https://firebaserules.googleapis.com/v1/projects/{P}/releases?pageSize=100").get("releases",[])
require(isinstance(releases,list) and bool(releases),"Firebase rules releases missing")
for label,suffix,local in [
 ("firestore","/cloud.firestore","firestore.rules"),
 ("storage","/firebase.storage/fidunio-fef13.firebasestorage.app","storage.rules"),
]:
    matches=[r for r in releases if r.get("name","").endswith(suffix)]
    require(len(matches)==1,f"{label} release ambiguous or missing")
    name=matches[0].get("rulesetName","")
    require(name.startswith(f"projects/{P}/rulesets/"),f"{label} ruleset invalid")
    ruleset=api("https://firebaserules.googleapis.com/v1/"+name)
    files=ruleset.get("source",{}).get("files",[])
    require(len(files)==1 and isinstance(files[0].get("content"),str),f"{label} ruleset unexpected file set")
    live=files[0]["content"].encode()
    checked=(root/local).read_bytes()
    require(live==checked,f"{label} live rules differ from checkout")
    report["rules"][label]={"release":matches[0]["name"],"ruleset":name,"sha256":digest(live),"updateTime":matches[0].get("updateTime")}
# Discover literal client calls across all tracked JS/TS source, alongside the mandatory manifest.
names=set(EXPECTED)
for path in run("git","ls-files","-z").split("\0"):
    if not path or not path.endswith((".js",".mjs",".ts",".tsx",".jsx")) or path.startswith("functions/"):
        continue
    source=(root/path).read_text(errors="replace")
    for pat in [r'callCloudFunction\s*\(\s*["\x27]([A-Za-z]\w+)["\x27]',
                r'httpsCallable\s*\(\s*[^,\n]+,\s*["\x27]([A-Za-z]\w+)["\x27]']:
        names.update(re.findall(pat,source))
    # Some clients pass callable names through wrappers and templates.
    names.update(set(re.findall(r'["\x27]([A-Za-z]\w+V1)["\x27]',source)) & set(EXPECTED))
# Any previously unknown literal callable must be explicitly classified before release.
require(names.issubset(EXPECTED),f"unclassified client callable(s): {sorted(names-set(EXPECTED))}")
listing=json.loads(run("gcloud","functions","list",f"--regions={REGION}","--format=json"))
require(isinstance(listing,list) and listing,"Cloud Functions listing missing")
live_names={x["name"].split("/")[-1] for x in listing if "name" in x}
require(names.issubset(live_names),f"missing live callable(s): {sorted(names-live_names)}")
for fn in sorted(names):
    doc=json.loads(run("gcloud","functions","describe",fn,"--gen2",f"--region={REGION}","--format=json"))
    require(doc.get("state")=="ACTIVE",f"{fn} not ACTIVE")
    service=doc.get("serviceConfig") or {}
    require(service.get("serviceAccountEmail")==SERVICE_ACCOUNTS[EXPECTED[fn]],f"{fn} runtime identity mismatch")
    keys=set((service.get("environmentVariables") or {}).keys()) | set((doc.get("buildConfig",{}).get("environmentVariables") or {}).keys())
    require(keys.issubset(ALLOW_ENV),f"{fn} unexpected environment-variable names: {sorted(keys-ALLOW_ENV)}")
    require(doc.get("updateTime") and service.get("revision"),f"{fn} deployment revision evidence unavailable")
    report["functions"][fn]={"state":"ACTIVE","serviceAccount":service["serviceAccountEmail"],
      "revision":service["revision"],"updateTime":doc["updateTime"],"envNames":sorted(keys)}
# App Check registration and service enforcement checked with the narrow custom role.
for name,url in {
 "iosAppAttest":f"https://firebaseappcheck.googleapis.com/v1/projects/{N}/apps/{IOS_APP}/appAttestConfig",
 "webRecaptcha":f"https://firebaseappcheck.googleapis.com/v1/projects/{N}/apps/{WEB_APP}/recaptchaEnterpriseConfig",
}.items():
    doc=api(url)
    require(doc.get("name"),f"{name} registration missing")
    report["appCheck"][name]={"name":doc["name"],"tokenTtl":doc.get("tokenTtl")}
services=api(f"https://firebaseappcheck.googleapis.com/v1/projects/{N}/services?pageSize=100").get("services",[])
require(isinstance(services,list) and services,"App Check services list absent")
for service in services:
    require(service.get("enforcementMode")!="ENFORCED","App Check enforced unexpectedly")
report["appCheck"]["services"]=[{"name":s.get("name"),"enforcementMode":s.get("enforcementMode"),"updateTime":s.get("updateTime")} for s in services]
out=root/"backend-audit-evidence"
out.mkdir(exist_ok=True)
dest=out/(sha+".json")
dest.write_text(json.dumps(report,indent=2,sort_keys=True)+"\n")
print(f"AUDIT GREEN for {sha}; evidence: {dest}")
