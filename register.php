<?php
// register.php
session_start();
require 'config.php';

$message = "";

// Initialize variables so we can repopulate the form if there is an error
$name = "";
$email = "";
$username = "";
$police_station = "";
$role = "IO"; // Default role

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // 1. Capture Input
    $name           = trim($_POST['name'] ?? '');
    $email          = trim($_POST['email'] ?? '');
    $username       = trim($_POST['username'] ?? '');
    $password       = $_POST['password'] ?? '';
    $confirm_pass   = $_POST['confirm_password'] ?? '';
    $role           = $_POST['role'] ?? 'IO';
    $police_station = trim($_POST['police_station'] ?? '');

    // 2. Validate
    if ($name === '' || $username === '' || $email === '' || $password === '' || $confirm_pass === '') {
        $message = "All fields marked * are required.";
    } elseif ($password !== $confirm_pass) {
        $message = "Passwords do not match.";
    } else {
        // 3. Check for duplicates
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->rowCount() > 0) {
            $message = "Username or Email already exists in the system.";
        } else {
            // 4. Insert User
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            
            $sql = "INSERT INTO users (name, email, username, password_hash, role, police_station) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $stmt = $pdo->prepare($sql);
            
            if ($stmt->execute([$name, $email, $username, $password_hash, $role, $police_station])) {
                // --- THE FIX: REDIRECT PATTERN ---
                // Save success message to session
                $_SESSION['success_message'] = "User registered successfully. You can now login.";
                
                // Redirect to login.php immediately
                header("Location: login.php");
                exit; // Stop script here
            } else {
                $message = "Database error: Could not register user.";
            }
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
        <div class="error" style="color: red; margin-bottom: 15px;">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Name *</label>
        <input type="text" name="name" required placeholder="Officer Name" value="<?= htmlspecialchars($name) ?>">

        <label>Email Address *</label>
        <input type="email" name="email" required placeholder="officer@dept.gov" value="<?= htmlspecialchars($email) ?>">

        <label>Username (Login ID) *</label>
        <input type="text" name="username" required value="<?= htmlspecialchars($username) ?>">

        <label>Password *</label>
        <input type="password" name="password" required>

        <label>Confirm Password *</label>
        <input type="password" name="confirm_password" required>

        <label>Role *</label>
        <select name="role" required>
            <option value="IO" <?= $role == 'IO' ? 'selected' : '' ?>>Investigating Officer (IO)</option>
            <option value="CLERK" <?= $role == 'CLERK' ? 'selected' : '' ?>>Muddemmal Clerk</option>
            <option value="SP" <?= $role == 'SP' ? 'selected' : '' ?>>Superintendent of Police (SP)</option>
            <option value="ADMIN" <?= $role == 'ADMIN' ? 'selected' : '' ?>>System Admin</option>
        </select>

        <label>Police Station / Unit</label>
        <input type="text" name="police_station" placeholder="e.g., Murbad PS" value="<?= htmlspecialchars($police_station) ?>">

        <button type="submit" class="btn">Register</button>
        <a href="login.php" class="btn btn-secondary">Back</a>
    </form>
</div>
</body>
</html>