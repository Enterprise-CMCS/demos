echo ""
echo "ruff"
echo "===="
ruff --config ../../pyproject.toml check .

echo ""
echo "pytest"
echo "======"
pytest -c ../../pyproject.toml --cov-config=../../pyproject.toml

echo ""
echo "pydoclint"
echo "========="
pydoclint -q --config=../../pyproject.toml .

echo ""
echo "mypy"
echo "===="
mypy --config-file ../../pyproject.toml .

echo ""
echo "radon cyclomatic complexity"
echo "====="
radon cc -s --exclude "*__init__.py,*test_*.py" .

echo ""
echo "radon maintainability index"
echo "==========================="
radon mi --exclude "*__init__.py,*test_*.py" .
