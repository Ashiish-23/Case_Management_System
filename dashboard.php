<?php
// dashboard.php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}
$user = $_SESSION['user'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - Case & Evidence Management</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
    <h2>Dashboard</h2>
    <p>Welcome, <strong><?php echo htmlspecialchars($user['name']); ?></strong> (Role: <?php echo htmlspecialchars($user['role']); ?>)</p>

    <ul>
        <li><a href="#">Create New Case (coming soon)</a></li>
        <li><a href="#">View Cases (coming soon)</a></li>
        <li><a href="#">Register Evidence (coming soon)</a></li>
        <li><a href="#">Transfer Evidence (coming soon)</a></li>
        <li><a href="#">Generate Reports (coming soon)</a></li>
    </ul>

    <a href="index.php" class="btn">Home</a>
    <a href="logout.php" class="btn btn-secondary">Logout</a>
</div>
</body>
</html>
