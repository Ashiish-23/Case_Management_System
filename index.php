<?php
session_start();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Police Evidence Management System</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>

    <nav class="navbar">
        <div class="logo">
            <i class="fa-solid fa-shield-halved"></i> KSP EVIDENCE VAULT
        </div>
        <div class="nav-links">
            <?php if (isset($_SESSION['user'])): ?>
                <span class="user-welcome">Hello, <strong><?= htmlspecialchars($_SESSION['user']['name']); ?></strong></span>
                <a href="dashboard.php" class="btn-nav">Dashboard</a>
                <a href="logout.php" class="btn-nav btn-logout">Logout</a>
            <?php else: ?>
                <a href="login.php" class="btn-nav">Login</a>
                <a href="register.php" class="btn-nav btn-register">Register Officer</a>
            <?php endif; ?>
        </div>
    </nav>

    <header class="hero">
        <div class="hero-content">
            <h1>Digital Chain of Custody</h1>
            <p>Secure. Immutable. Transparent.</p>
            <p class="hero-sub">
                A state-of-the-art Evidence Management System designed for the Police Department. 
                Secured by Blockchain technology to ensure zero tampering of sensitive case data.
            </p>
            
            <?php if (!isset($_SESSION['user'])): ?>
                <div class="hero-actions">
                    <a href="login.php" class="btn btn-lg">Access Portal</a>
                </div>
            <?php else: ?>
                <div class="hero-actions">
                    <a href="dashboard.php" class="btn btn-lg">Go to Console</a>
                </div>
            <?php endif; ?>
        </div>
    </header>

    <section class="features">
        <div class="feature-card">
            <div class="icon">🔒</div>
            <h3>Bank-Grade Security</h3>
            <p>All evidence is encrypted using AES-256 standards. Only authorized personnel with specific clearance levels can access sensitive case files.</p>
        </div>
        
        <div class="feature-card">
            <div class="icon">🔗</div>
            <h3>Blockchain Integrated</h3>
            <p>We utilize a private blockchain ledger to create an immutable history of every evidence interaction. Tampering is mathematically impossible.</p>
        </div>
        
        <div class="feature-card">
            <div class="icon">📁</div>
            <h3>Digital Archives</h3>
            <p>Upload crime scene photos, documents, and reports directly to the cloud-free local server. Search and retrieve cases in milliseconds.</p>
        </div>
    </section>

    <footer>
        <p>&copy; <?php echo date("Y"); ?> Police Department Evidence Wing. Authorized Use Only.</p>
    </footer>

</body>
</html>