const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');

    closeAllSubMenus();
}

function toggleSubMenu(button) {

    // Cierra todos los submenús si otro está siendo abierto
    if(!button.nextElementSibling.classList.contains('show')) {
        closeAllSubMenus();
        }

    // Alterna el estado del submenú actual
    button.nextElementSibling.classList.toggle('show')
    button.classList.toggle('rotate')

    // Si el sidebar está cerrado, lo abre al interactuar con un submenú
    if(sidebar.classList.contains('close')){
        sidebar.classList.toggle('close')
        toggleButton.classList.toggle('rotate')
    }
}

function closeAllSubMenus(){
    Array.from(sidebar.getElementsByClassName('show')).forEach(ul => { 
        ul.classList.remove('show')
        ul.previousElementSibling.classList.remove('rotate')
    })
}