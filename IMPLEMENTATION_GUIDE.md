# Dark Mode + Multi-Language Implementation Guide

## STEP 1: Install Dependencies
```bash
cd frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

## STEP 2: Update Existing Files

### 2.1 Update `tailwind.config.js`
- ADD `darkMode: 'class',` after line 2

### 2.2 Update `index.css`
- ADD dark mode variables after `:root { }`
- UPDATE `body` class to include dark mode

## STEP 3: Create New Files

### 3.1 Create `frontend/src/context/ThemeContext.jsx`
### 3.2 Create `frontend/src/i18n/index.js`
### 3.3 Create `frontend/src/i18n/locales/en.json`
### 3.4 Create `frontend/src/i18n/locales/hi.json`
### 3.5 Create `frontend/src/i18n/locales/mr.json`

## STEP 4: Update App.jsx
- Wrap with ThemeProvider
- Add i18n initialization

## STEP 5: Add Theme & Language Toggles to Layout
- Add buttons in navbar

---

## Files Status:
✅ tailwind.config.js - READY TO UPDATE
✅ index.css - READY TO UPDATE  
⏳ ThemeContext.jsx - TO CREATE
⏳ i18n files - TO CREATE
⏳ App.jsx - TO UPDATE
EOF
cat IMPLEMENTATION_GUIDE.md
Output

# Dark Mode + Multi-Language Implementation Guide

## STEP 1: Install Dependencies
```bash
cd frontend
npm install i18next react-i18next i18next-browser-languagedetector
```

## STEP 2: Update Existing Files

### 2.1 Update `tailwind.config.js`
- ADD `darkMode: 'class',` after line 2

### 2.2 Update `index.css`
- ADD dark mode variables after `:root { }`
- UPDATE `body` class to include dark mode

## STEP 3: Create New Files

### 3.1 Create `frontend/src/context/ThemeContext.jsx`
### 3.2 Create `frontend/src/i18n/index.js`
### 3.3 Create `frontend/src/i18n/locales/en.json`
### 3.4 Create `frontend/src/i18n/locales/hi.json`
### 3.5 Create `frontend/src/i18n/locales/mr.json`

## STEP 4: Update App.jsx
- Wrap with ThemeProvider
- Add i18n initialization

## STEP 5: Add Theme & Language Toggles to Layout
- Add buttons in navbar

---

## Files Status:
✅ tailwind.config.js - READY TO UPDATE
✅ index.css - READY TO UPDATE  
⏳ ThemeContext.jsx - TO CREATE
⏳ i18n files - TO CREATE
⏳ App.jsx - TO UPDATE