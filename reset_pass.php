<?php
// reset_password.php
require 'config.php';

$message = "";
$error = "";
$valid_link = false;

// 1. GET THE TOKEN & EMAIL FROM THE LINK
if (isset($_GET['token']) && isset($_GET['email'])) {
    $token = $_GET['token'];
    $email = $_GET['email'];

    // 2. CHECK DATABASE FOR MATCH
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expires > NOW()");
    $stmt->execute([$email, $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $valid_link = true;
    } else {
        $error = "Invalid or expired reset link.";
    }
} else {
    $error = "Missing reset token.";
}

// 3. UPDATE PASSWORD
if ($_SERVER["REQUEST_METHOD"] === "POST" && $valid_link) {
    $new_pass = $_POST['password'];
    $confirm_pass = $_POST['confirm_password'];

    if ($new_pass !== $confirm_pass) {
        $error = "Passwords do not match.";
    } else {
        $new_hash = password_hash($new_pass, PASSWORD_BCRYPT);

        // Update password and REMOVE the token so it can't be used again
        $update = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE email = ?");
        $update->execute([$new_hash, $email]);

        $message = "Password updated! You can now login.";
        $valid_link = false; // Hide the form
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reset Password</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
    <h2>Set New Password</h2>

    <?php if ($error): ?>
        <p style="color: red;"><?= htmlspecialchars($error) ?></p>
    <?php elseif ($message): ?>
        <p style="color: green;"><?= htmlspecialchars($message) ?></p>
        <a href="login.php" class="btn">Go to Login</a>
    <?php endif; ?>

    <?php if ($valid_link): ?>
        <form method="POST" action="">
            <label>New Password</label>
            <input type="password" name="password" required>
            
            <label>Confirm Password</label>
            <input type="password" name="confirm_password" required>

            <button type="submit" class="btn">Update Password</button>
        </form>
    <?php endif; ?>
</div>
</body>
</html>