document.addEventListener('DOMContentLoaded', function() {
	document.body.innerHTML = unescape(window.location.hash.substr(1));
});