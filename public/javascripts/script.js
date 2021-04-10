$(document).ready(function () {
    $('#usersTable').DataTable();
});

function confirmDelete(url) {
    const result = confirm('Are you sure you want to delete?');
    if (result) {
        window.location = url;
    }
}
