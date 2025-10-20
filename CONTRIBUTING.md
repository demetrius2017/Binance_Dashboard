# Contributing to Binance Real-Time Dashboard

Thank you for your interest in contributing to the Binance Real-Time Dashboard! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/demetrius2017/Binance_Dashboard/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Python version, browser)

### Suggesting Enhancements

1. Check existing issues for similar suggestions
2. Create a new issue with:
   - Clear description of the enhancement
   - Use cases and benefits
   - Mockups or examples if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🔧 Development Setup

1. Clone your fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/Binance_Dashboard.git
   cd Binance_Dashboard
   ```

2. Create virtual environment
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Run tests
   ```bash
   python -m pytest test_app.py -v
   ```

5. Start development server
   ```bash
   python app.py
   ```

## 📝 Coding Standards

### Python Code Style

- Follow PEP 8 guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and concise
- Add comments for complex logic

### JavaScript Code Style

- Use ES6+ features
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and concise
- Handle errors gracefully

### CSS/HTML

- Use semantic HTML5 elements
- Follow BEM naming convention for CSS classes
- Ensure responsive design
- Test on multiple browsers

## 🧪 Testing Guidelines

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test edge cases and error conditions

### Running Tests

```bash
# Run all tests
python -m pytest test_app.py -v

# Run specific test
python -m pytest test_app.py::test_name -v

# Run with coverage
pip install pytest-cov
python -m pytest --cov=app test_app.py
```

## 📚 Documentation

- Update README.md for user-facing changes
- Update DEPLOYMENT.md for deployment changes
- Add docstrings to new functions/classes
- Comment complex code sections

## 🔄 Git Workflow

1. Keep commits atomic and focused
2. Write clear commit messages
3. Reference issues in commits (e.g., "Fix #123")
4. Rebase on main before submitting PR
5. Squash commits if necessary

### Commit Message Format

```
Type: Brief description (50 chars or less)

Longer explanation if needed (wrap at 72 chars).
- Bullet points are okay
- Use present tense: "Add feature" not "Added feature"

Fixes #123
```

**Types**: `Feat`, `Fix`, `Docs`, `Style`, `Refactor`, `Test`, `Chore`

## 🎨 Feature Ideas

Here are some areas where contributions are welcome:

### High Priority
- [ ] Portfolio tracking with buy/sell transactions
- [ ] Price alerts and notifications
- [ ] Historical data export (CSV/JSON)
- [ ] Advanced technical indicators

### Medium Priority
- [ ] User authentication and saved preferences
- [ ] Multiple theme support
- [ ] Trading signals based on indicators
- [ ] Mobile app version

### Low Priority
- [ ] Multi-exchange support (Coinbase, Kraken, etc.)
- [ ] Backtesting capabilities
- [ ] Social features (share watchlists)

## 🐛 Bug Priority

- **Critical**: Security issues, data loss, crashes
- **High**: Major features broken, widespread issues
- **Medium**: Minor features broken, affects some users
- **Low**: Cosmetic issues, edge cases

## ✅ Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No merge conflicts with main
- [ ] PR description explains the changes

## 🔒 Security

- Never commit API keys or secrets
- Report security vulnerabilities privately to maintainers
- Don't include sensitive data in issues or PRs

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

- Open a discussion on GitHub
- Check existing issues and documentation
- Reach out to maintainers

## 🙏 Recognition

Contributors will be recognized in:
- README.md (Contributors section)
- Release notes for their contributions
- Project documentation

Thank you for contributing! 🎉
