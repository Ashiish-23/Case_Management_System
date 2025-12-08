<?php
// login.php
session_start();
require 'config.php';

$message = "";
$success_message = "";

// --- 1. CATCH SUCCESS MESSAGES FROM OTHER PAGES ---
// This handles "Registration Successful" or "Password Updated" redirects
if (isset($_SESSION['success_message'])) {
    $success_message = $_SESSION['success_message'];
    unset($_SESSION['success_message']); // Clear it so it doesn't show on refresh
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $message = "Please enter both username and password.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password_hash'])) {
            // Correct login
            $_SESSION['user'] = [
                'id'             => $user['id'],
                'name'           => $user['NAME'],
                'username'       => $user['username'],
                'role'           => $user['role'],
                'police_station' => $user['police_station']
            ];
            header("Location: dashboard.php");
            exit;
        } else {
            $message = "Invalid username or password.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Login - Case & Evidence Management</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="container">
    <h2>Login</h2>
    <p>Enter your credentials to access the system.</p>

    <?php if ($success_message): ?>
        <div class="success" style="color: #15803d; background: #dcfce7; padding: 10px; border-radius: 4px; margin-bottom: 15px; border: 1px solid #15803d;">
            <?php echo htmlspecialchars($success_message); ?>
        </div>
    <?php endif; ?>

    <?php if ($message): ?>
        <div class="error" style="color: #b91c1c; background: #fee2e2; padding: 10px; border-radius: 4px; margin-bottom: 15px; border: 1px solid #b91c1c;">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Username</label>
        <input type="text" name="username" required>

        <label>Password</label>
        <input type="password" name="password" required>
        
        <div style="text-align: right; margin-bottom: 15px; margin-top: 10px;">
            <a href="Forgot_pass.php" style="color: #4b5563; text-decoration: none; font-size: 0.85rem;">Forgot Password?</a>
        </div>

        <button type="submit" class="btn">Login</button>
        <a href="index.php" class="btn btn-secondary">Back</a>
    </form>
    
</div>
</body>
</html>