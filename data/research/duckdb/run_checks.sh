echo ""
echo "Ruff"
echo "===="
ruff check .

echo ""
echo "pydocstyle"
echo "=========="
pydocstyle .

echo ""
echo "pydoctest"
echo "========="
pydoctest --config ../../pydoctest.json

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
