<!-- index.php -->
<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Case & Evidence Management System</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container center">
        <h1>Case & Evidence Management System</h1>
        <p>Secure, digital evidence tracking for Police Department.</p>

        <?php if (isset($_SESSION['user'])): ?>
            <p>Welcome, <strong><?php echo htmlspecialchars($_SESSION['user']['name']); ?></strong></p>
            <a href="dashboard.php" class="btn">Go to Dashboard</a>
            <a href="logout.php" class="btn btn-secondary">Logout</a>
        <?php else: ?>
            <a href="login.php" class="btn">Login</a>
            <a href="register.php" class="btn btn-secondary">Register</a>
        <?php endif; ?>
    </div>
</body>
</html>
