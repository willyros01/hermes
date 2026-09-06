import {validateInvitation as readInvitation,createFidunioInvitation as createInvitation,redeemFidunioInvitation as redeemInvitation,listPendingFidunioInvitations as listPending,revokeFidunioInvitation as revokeInvitation} from './firebase.js';
let mutationTail=Promise.resolve();
function serialize(work){const run=mutationTail.then(work,work);mutationTail=run.catch(()=>{});return run;}
export function validateFidunioInvitation(token){return readInvitation(token);}
export function createInvitationForEnrollment(role='user',days=7){return serialize(()=>createInvitation(role,days));}
export function redeemInvitationForEnrollment(token,email,password,displayName){return serialize(()=>redeemInvitation(token,email,password,displayName));}
export function listPendingInvitationsForAdmin(){return listPending();}
export function revokeInvitationForAdmin(id){return serialize(()=>revokeInvitation(id));}
export const INVITATION_OWNER_V1=Object.freeze({owner:'invitation-owner.js',firebaseRepository:'firebase.js',serializedMutations:true,installIndependent:true,rejectedHistoricalInviteInstallReuse:false});
