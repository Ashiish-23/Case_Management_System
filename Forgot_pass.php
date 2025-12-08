<?php
// Forgot_pass.php
session_start();
require 'config.php';

// --- 1. HANDLE FORM SUBMISSION (POST) ---
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST['email'] ?? '');

    if (empty($email)) {
        $_SESSION['error'] = "Please enter your email address.";
    } else {
        // Check if email exists
        $stmt = $pdo->prepare("SELECT id, username FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Generate Token
            $token = bin2hex(random_bytes(32));
            // 3. Save token to database using MySQL's DATE_ADD function
            // We removed $expires from PHP and put the logic directly in the SQL string
            $update = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?");
            $update->execute([$token, $email]);

            // Generate Link
            // IMPORTANT: Make sure this filename matches your actual reset file (reset_pass.php vs reset_password.php)
            $reset_link = "http://localhost/Case%20Management%20System/reset_pass.php?token=" . $token . "&email=" . $email;

            // Save to SESSION (so it survives the redirect)
            $_SESSION['success'] = "A reset link has been generated.";
            $_SESSION['dev_link'] = $reset_link; // Save link for testing
            
        } else {
            // Security: Don't reveal if user exists
            $_SESSION['success'] = "If that email exists in our system, we have sent a reset link.";
        }
    }

    // --- THE FIX: REDIRECT TO SELF ---
    // This clears the form data so "Confirm Form Resubmission" never happens
    header("Location: " . $_SERVER['PHP_SELF']);
    exit;
}

// --- 2. HANDLE DISPLAY (GET) ---
// Pop variables from session and delete them
$message = $_SESSION['success'] ?? '';
$error   = $_SESSION['error'] ?? '';
$dev_link = $_SESSION['dev_link'] ?? '';

unset($_SESSION['success'], $_SESSION['error'], $_SESSION['dev_link']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forgot Password</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
    <h2>Recovery Protocol</h2>
    <p>Enter your registered email to receive a secure reset link.</p>

    <?php if ($message): ?>
        <div style="color: #22c55e; background: #dcfce7; padding: 10px; margin-bottom: 15px; border: 1px solid #22c55e; border-radius: 4px;">
            <?= htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div style="color: #b91c1c; background: #fee2e2; padding: 10px; margin-bottom: 15px; border: 1px solid #b91c1c; border-radius: 4px;">
            <?= htmlspecialchars($error); ?>
        </div>
    <?php endif; ?>

    <?php if ($dev_link): ?>
        <div style="background: #1f2937; color: #fff; padding: 15px; margin-bottom: 20px; border: 1px dashed #fbbf24; word-break: break-all; text-align: left;">
            <strong style="color: #fbbf24;">[DEV MODE] Click here to reset:</strong><br><br>
            <a href="<?= $dev_link ?>" style="color: #4ade80; text-decoration: underline;"><?= $dev_link ?></a>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Email Address</label>
        <input type="email" name="email" required placeholder="officer@dept.gov">
        
        <button type="submit" class="btn">Send Reset Link</button>
        <a href="login.php" class="btn btn-secondary" style="margin-top: 10px; display:block; text-align:center;">Back to Login</a>
    </form>
</div>
</body>
</html>