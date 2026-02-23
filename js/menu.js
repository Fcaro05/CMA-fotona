function openNav() {
    document.getElementById("cmaSidenav").style.transform = "translateX(0)";
    document.getElementById("overlay").style.display = "block"; 
    document.body.style.overflow = "hidden"; 
}
function closeNav() {
    document.getElementById("cmaSidenav").style.transform = "translateX(100%)";
    document.getElementById("overlay").style.display = "none";
    document.body.style.overflow = "";
}
window.addEventListener('scroll', function() {
	const navbar = document.getElementById('header');
	const topbar = document.getElementById('topbar');
	if (window.scrollY > 50) {
		navbar.classList.add('scrolled');
		topbar.classList.add('scrolled');
	} else {
		navbar.classList.remove('scrolled');
		topbar.classList.remove('scrolled');
	}
});