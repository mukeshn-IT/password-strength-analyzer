class PasswordGenerator {
    constructor() {
        this.uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.lowercase = 'abcdefghijklmnopqrstuvwxyz';
        this.numbers = '0123456789';
        this.specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    generate(length, options) {
        let charset = '';
        
        if (options.uppercase) charset += this.uppercase;
        if (options.lowercase) charset += this.lowercase;
        if (options.numbers) charset += this.numbers;
        if (options.special) charset += this.specialChars;

        if (charset === '') {
            return '';
        }

        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }

        return password;
    }
}

class PasswordStrengthAnalyzer {
    constructor() {
        this.minLength = 8;
        this.recommendedLength = 12;
        this.specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }

    analyzePassword(password) {
        if (!password) {
            return {
                strength: "Empty",
                score: 0,
                feedback: ["Password cannot be empty!"],
                checks: {
                    length: false,
                    uppercase: false,
                    lowercase: false,
                    numbers: false,
                    special: false
                }
            };
        }

        const checks = {
            length: password.length >= this.minLength,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            numbers: /\d/.test(password),
            special: new RegExp(`[${this.escapeRegex(this.specialChars)}]`).test(password)
        };

        let score = Object.values(checks).filter(v => v).length;

        if (password.length >= this.recommendedLength) {
            score += 1;
        }

        let strength;
        if (score <= 2) {
            strength = "Weak";
        } else if (score <= 4) {
            strength = "Medium";
        } else if (score <= 5) {
            strength = "Strong";
        } else {
            strength = "Very Strong";
        }

        const feedback = this.generateFeedback(checks, password);

        return {
            strength,
            score,
            feedback,
            checks,
            length: password.length
        };
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    generateFeedback(checks, password) {
        const feedback = [];

        if (!checks.length) {
            feedback.push(`❌ Password is too short (minimum ${this.minLength} characters)`);
        } else if (password.length < this.recommendedLength) {
            feedback.push(`⚠️  Password length is okay, but ${this.recommendedLength}+ characters is recommended`);
        } else {
            feedback.push(`✓ Good password length (${password.length} characters)`);
        }

        if (!checks.uppercase) {
            feedback.push("❌ Add uppercase letters (A-Z)");
        } else {
            feedback.push("✓ Contains uppercase letters");
        }

        if (!checks.lowercase) {
            feedback.push("❌ Add lowercase letters (a-z)");
        } else {
            feedback.push("✓ Contains lowercase letters");
        }

        if (!checks.numbers) {
            feedback.push("❌ Add numbers (0-9)");
        } else {
            feedback.push("✓ Contains numbers");
        }

        if (!checks.special) {
            feedback.push(`❌ Add special characters (${this.specialChars})`);
        } else {
            feedback.push("✓ Contains special characters");
        }

        if (Object.values(checks).every(v => v)) {
            feedback.push("\n✅ Great! Your password meets all requirements.");
        }

        if (/(.)\1{2,}/.test(password)) {
            feedback.push("⚠️  Avoid repeating characters (e.g., 'aaa', '111')");
        }

        if (/123|abc|qwerty|password/i.test(password)) {
            feedback.push("⚠️  Avoid common patterns like '123', 'abc', 'qwerty', or 'password'");
        }

        return feedback;
    }
}

// UI Controller
class PasswordAnalyzerUI {
    constructor() {
        this.analyzer = new PasswordStrengthAnalyzer();
        this.generator = new PasswordGenerator();
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.resultsSection = document.getElementById('resultsSection');
        this.strengthValue = document.getElementById('strengthValue');
        this.scoreValue = document.getElementById('scoreValue');
        this.progressFill = document.getElementById('progressFill');
        this.feedbackList = document.getElementById('feedbackList');
        this.suggestionsList = document.getElementById('suggestionsList');
        this.suggestionsSection = document.getElementById('suggestionsSection');
        
        // Generator elements
        this.passwordLength = document.getElementById('passwordLength');
        this.lengthValue = document.getElementById('lengthValue');
        this.includeUppercase = document.getElementById('includeUppercase');
        this.includeLowercase = document.getElementById('includeLowercase');
        this.includeNumbers = document.getElementById('includeNumbers');
        this.includeSpecial = document.getElementById('includeSpecial');
        this.generateBtn = document.getElementById('generateBtn');
        this.generatedPasswordSection = document.getElementById('generatedPasswordSection');
        this.generatedPassword = document.getElementById('generatedPassword');
        this.copyBtn = document.getElementById('copyBtn');
        this.copyFeedback = document.getElementById('copyFeedback');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.passwordInput.addEventListener('input', () => this.handlePasswordInput());
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Generator event listeners
        this.passwordLength.addEventListener('input', () => this.updateLengthValue());
        this.generateBtn.addEventListener('click', () => this.generatePassword());
        this.copyBtn.addEventListener('click', () => this.copyPassword());
    }

    handlePasswordInput() {
        const password = this.passwordInput.value;
        
        if (password.length === 0) {
            this.resultsSection.style.display = 'none';
            return;
        }

        const analysis = this.analyzer.analyzePassword(password);
        this.displayResults(analysis);
    }

    displayResults(analysis) {
        this.resultsSection.style.display = 'block';

        // Update strength meter
        this.strengthValue.textContent = analysis.strength;
        this.strengthValue.className = 'strength-value ' + this.getStrengthClass(analysis.strength);
        this.scoreValue.textContent = analysis.score;

        // Update progress bar
        const progressPercentage = (analysis.score / 6) * 100;
        this.progressFill.style.width = progressPercentage + '%';

        // Update check items
        this.updateCheckItem('checkLength', analysis.checks.length);
        this.updateCheckItem('checkUppercase', analysis.checks.uppercase);
        this.updateCheckItem('checkLowercase', analysis.checks.lowercase);
        this.updateCheckItem('checkNumbers', analysis.checks.numbers);
        this.updateCheckItem('checkSpecial', analysis.checks.special);

        // Update feedback
        this.feedbackList.innerHTML = analysis.feedback
            .map(item => `<li>${item}</li>`)
            .join('');

        // Show suggestions for weak/medium passwords
        if (analysis.strength === 'Weak' || analysis.strength === 'Medium') {
            this.suggestionsSection.style.display = 'block';
            this.displaySuggestions();
        } else {
            this.suggestionsSection.style.display = 'none';
        }
    }

    updateCheckItem(elementId, passed) {
        const element = document.getElementById(elementId);
        const icon = element.querySelector('.check-icon');
        
        if (passed) {
            element.classList.add('passed');
            element.classList.remove('failed');
            icon.textContent = '✓';
        } else {
            element.classList.add('failed');
            element.classList.remove('passed');
            icon.textContent = '❌';
        }
    }

    getStrengthClass(strength) {
        const classes = {
            'Weak': 'weak',
            'Medium': 'medium',
            'Strong': 'strong',
            'Very Strong': 'very-strong'
        };
        return classes[strength] || '';
    }

    displaySuggestions() {
        const suggestions = [
            "Use a passphrase instead of a single word",
            "Mix character types (upper, lower, numbers, symbols)",
            "Avoid personal information (birthdays, names)",
            "Use different passwords for different accounts",
            "Consider using a password manager",
            "Change passwords regularly",
            "Never share your passwords with others"
        ];

        this.suggestionsList.innerHTML = suggestions
            .map(suggestion => `<li>${suggestion}</li>`)
            .join('');
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.type === 'password' ? 'text' : 'password';
        this.passwordInput.type = type;
        this.togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
    }

    updateLengthValue() {
        this.lengthValue.textContent = this.passwordLength.value;
    }

    generatePassword() {
        const length = parseInt(this.passwordLength.value);
        const options = {
            uppercase: this.includeUppercase.checked,
            lowercase: this.includeLowercase.checked,
            numbers: this.includeNumbers.checked,
            special: this.includeSpecial.checked
        };

        const password = this.generator.generate(length, options);
        
        if (password) {
            this.generatedPassword.value = password;
            this.generatedPasswordSection.style.display = 'block';
            
            // Automatically analyze the generated password
            this.passwordInput.value = password;
            const analysis = this.analyzer.analyzePassword(password);
            this.displayResults(analysis);
        } else {
            alert('Please select at least one character type!');
        }
    }

    copyPassword() {
        this.generatedPassword.select();
        this.generatedPassword.setSelectionRange(0, 99999); // For mobile devices
        
        navigator.clipboard.writeText(this.generatedPassword.value).then(() => {
            this.copyFeedback.classList.add('show');
            setTimeout(() => {
                this.copyFeedback.classList.remove('show');
            }, 2000);
        }).catch(err => {
            // Fallback for older browsers
            document.execCommand('copy');
            this.copyFeedback.classList.add('show');
            setTimeout(() => {
                this.copyFeedback.classList.remove('show');
            }, 2000);
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PasswordAnalyzerUI();
});
