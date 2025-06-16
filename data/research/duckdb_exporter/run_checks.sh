echo ""
echo "Ruff"
echo "===="
ruff check .

echo ""
echo "pydocstyle"
echo "=========="
pydocstyle .

echo ""
echo "pydoclint"
echo "========="
pydoclint --config=../../pyproject.toml .

echo ""
echo "mypy"
echo "===="
mypy .

echo ""
echo "radon cyclomatic complexity"
echo "====="
radon cc -s .

echo ""
echo "radon maintainability index"
echo "==========================="
radon mi .
