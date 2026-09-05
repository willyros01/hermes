#!/usr/bin/env python3
"""FIDUNIO direct Firestore test-data purge.

Runs OUTSIDE the web app and uses the Google Cloud access token of the current
Cloud Shell/gcloud session, so Firestore client security rules do not apply.

Preserves:
  - Firebase Authentication users
  - users/{uid} profile documents (except old E2EE compatibility fields)
  - system/*
  - invitations/*

Deletes:
  - conversations/* and their messages/* subcollections
  - groups/* and their members/* and messages/* subcollections
  - users/{uid}/devices/*
  - users/{uid} fields: e2eePublicJwk, e2eeVersion, e2eeUpdatedAt

Project is intentionally fixed to fidunio-fef13.
"""

import json
import subprocess
import sys
import urllib.parse
import urllib.request

PROJECT = "fidunio-fef13"
DB = "(default)"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DB}/documents"


def token():
    try:
        return subprocess.check_output(
            ["gcloud", "auth", "print-access-token"], text=True
        ).strip()
    except Exception as e:
        raise SystemExit(f"Could not get Google Cloud access token: {e}")


ACCESS_TOKEN = token()


def request(method, url, body=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise RuntimeError(f"{method} {url}\nHTTP {e.code}: {detail}") from e


def list_docs(path):
    docs = []
    page_token = None
    while True:
        params = {"pageSize": "300"}
        if page_token:
            params["pageToken"] = page_token
        url = f"{BASE}/{path}?{urllib.parse.urlencode(params)}"
        payload = request("GET", url) or {}
        docs.extend(payload.get("documents", []))
        page_token = payload.get("nextPageToken")
        if not page_token:
            return docs


def doc_id(doc):
    return doc["name"].rsplit("/", 1)[-1]


def delete_doc_name(name):
    request("DELETE", f"https://firestore.googleapis.com/v1/{name}")


def delete_subcollection(parent_path, subcollection):
    path = f"{parent_path}/{subcollection}"
    docs = list_docs(path)
    for d in docs:
        delete_doc_name(d["name"])
    return len(docs)


def delete_collection_recursive(root_collection, subcollections):
    docs = list_docs(root_collection)
    subcounts = {name: 0 for name in subcollections}
    for d in docs:
        did = doc_id(d)
        parent = f"{root_collection}/{did}"
        for sub in subcollections:
            subcounts[sub] += delete_subcollection(parent, sub)
        delete_doc_name(d["name"])
    return len(docs), subcounts


def clear_user_e2ee_fields(user_doc_name):
    # Firestore PATCH: fields named in updateMask but omitted from body are deleted.
    fields = ["e2eePublicJwk", "e2eeVersion", "e2eeUpdatedAt"]
    params = [("updateMask.fieldPaths", f) for f in fields]
    url = (
        f"https://firestore.googleapis.com/v1/{user_doc_name}?"
        + urllib.parse.urlencode(params)
    )
    request("PATCH", url, {"fields": {}})


def main():
    if "--apply" not in sys.argv:
        print("DRY RUN ONLY. Nothing will be deleted.\n")
        conv = list_docs("conversations")
        groups = list_docs("groups")
        users = list_docs("users")
        device_count = 0
        message_count = 0
        group_member_count = 0
        group_message_count = 0
        for c in conv:
            message_count += len(list_docs(f"conversations/{doc_id(c)}/messages"))
        for g in groups:
            gid = doc_id(g)
            group_member_count += len(list_docs(f"groups/{gid}/members"))
            try:
                group_message_count += len(list_docs(f"groups/{gid}/messages"))
            except Exception:
                pass
        for u in users:
            device_count += len(list_docs(f"users/{doc_id(u)}/devices"))
        print(f"conversations: {len(conv)}")
        print(f"conversation messages: {message_count}")
        print(f"groups: {len(groups)}")
        print(f"group members: {group_member_count}")
        print(f"group messages: {group_message_count}")
        print(f"device registrations: {device_count}")
        print(f"user profiles preserved: {len(users)}")
        print("\nRun again with --apply to perform the purge.")
        return

    print("FIDUNIO DIRECT FIRESTORE TEST-DATA PURGE")
    confirm = input("Type DELETE TEST DATA to continue: ").strip()
    if confirm != "DELETE TEST DATA":
        print("Cancelled. Nothing deleted.")
        return

    conv_count, conv_sub = delete_collection_recursive("conversations", ["messages"])
    group_count, group_sub = delete_collection_recursive("groups", ["members", "messages"])

    users = list_docs("users")
    devices = 0
    profiles_cleared = 0
    for u in users:
        uid = doc_id(u)
        devices += delete_subcollection(f"users/{uid}", "devices")
        clear_user_e2ee_fields(u["name"])
        profiles_cleared += 1

    print("\nPURGE COMPLETE")
    print(f"conversations deleted: {conv_count}")
    print(f"conversation messages deleted: {conv_sub['messages']}")
    print(f"groups deleted: {group_count}")
    print(f"group members deleted: {group_sub['members']}")
    print(f"group messages deleted: {group_sub['messages']}")
    print(f"device registrations deleted: {devices}")
    print(f"user profiles preserved / E2EE fields cleared: {profiles_cleared}")
    print("system/*, invitations/*, and Authentication users were not touched.")


if __name__ == "__main__":
    main()
