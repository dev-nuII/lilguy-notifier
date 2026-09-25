// wiring/cloud-init.js
// Kicks off the IP lookup as soon as the page loads.
getIp().then(ip => { userIp = ip; }).catch(() => {});
