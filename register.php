<?php
// register.php
session_start();
require 'config.php';

$message = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name           = trim($_POST['name'] ?? '');
    $username       = trim($_POST['username'] ?? '');
    $password       = $_POST['password'] ?? '';
    $confirm_pass   = $_POST['confirm_password'] ?? '';
    $role           = $_POST['role'] ?? 'IO';
    $police_station = trim($_POST['police_station'] ?? '');

    if ($name === '' || $username === '' || $password === '' || $confirm_pass === '') {
        $message = "All fields marked * are required.";
    } elseif ($password !== $confirm_pass) {
        $message = "Passwords do not match.";
    } else {
        // Check if username exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->rowCount() > 0) {
            $message = "Username already taken. Choose another.";
        } else {
            // Insert user
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (name, username, password_hash, role, police_station) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$name, $username, $password_hash, $role, $police_station]);
            $message = "User registered successfully. You can now login.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Register - Case & Evidence Management</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
    <h2>Register User</h2>
    <p>Use this to create accounts for officers, clerks, and SP/admin.</p>

    <?php if ($message): ?>
        <div class="<?php echo (str_contains($message, 'successfully') ? 'success' : 'error'); ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Name *</label>
        <input type="text" name="name" required>

        <label>Username (Login ID) *</label>
        <input type="text" name="username" required>

        <label>Password *</label>
        <input type="password" name="password" required>

        <label>Confirm Password *</label>
        <input type="password" name="confirm_password" required>

        <label>Role *</label>
        <select name="role" required>
            <option value="IO">Investigating Officer (IO)</option>
            <option value="CLERK">Muddemmal Clerk</option>
            <option value="SP">Superintendent of Police (SP)</option>
            <option value="ADMIN">System Admin</option>
        </select>

        <label>Police Station / Unit</label>
        <input type="text" name="police_station" placeholder="e.g., Murbad PS">

        <button type="submit" class="btn">Register</button>
        <a href="index.php" class="btn btn-secondary">Back</a>
    </form>
</div>
</body>
</html>
