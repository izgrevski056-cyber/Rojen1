const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

async function assertAdmin(uid) {
  const doc = await getFirestore().doc(`users/${uid}`).get();
  if (!doc.exists || doc.data().role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
}

exports.adminResetPassword = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  await assertAdmin(request.auth.uid);

  const { uid, newPassword } = request.data || {};

  if (!uid || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Valid uid and password (min 6 chars) required.');
  }

  const driverDoc = await getFirestore().doc(`users/${uid}`).get();
  if (!driverDoc.exists || driverDoc.data().role !== 'driver') {
    throw new HttpsError('not-found', 'Driver account not found.');
  }

  await getAuth().updateUser(uid, { password: newPassword });

  return { success: true };
});
