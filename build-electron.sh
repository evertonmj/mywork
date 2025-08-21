#!/bin/bash
# Build script for Electron + Backend with versioning
set -e

# Get version from frontend/package.json
VERSION=$(grep '"version"' frontend/package.json | head -1 | awk -F: '{ print $2 }' | sed 's/[", ]//g')
RELEASE_DIR="releases/v$VERSION"

echo "Building version $VERSION..."
mkdir -p "$RELEASE_DIR"

# Build backend (PyInstaller)
echo "Building backend..."
cd backend
source venv/bin/activate
pyinstaller --clean --onefile main.py --distpath "../$RELEASE_DIR/backend" --workpath build/main --specpath build/main
deactivate
cd ..

# Build Electron app
echo "Building Electron app..."
npx electron-builder --config package.json --dir
cd ..

# Move Electron build outputs to releases
if [ -d "frontend/dist" ]; then
	mv frontend/dist "$RELEASE_DIR/electron"
fi

# Build frontend (Next.js)
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Copy frontend build outputs to releases
if [ -d "frontend/.next" ]; then
	mkdir -p "$RELEASE_DIR/frontend"
	cp -r frontend/.next "$RELEASE_DIR/frontend/build"
fi

# Update version.txt
echo "$VERSION" > "$RELEASE_DIR/version.txt"

# Update CHANGELOG.md
DATE=$(date '+%Y-%m-%d %H:%M:%S')
echo -e "\n## Version $VERSION - $DATE\n- Build completed and executables saved to $RELEASE_DIR" >> CHANGELOG.md

echo "Build and packaging complete. Outputs in $RELEASE_DIR."
