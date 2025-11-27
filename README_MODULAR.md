# IGP SmartStock - Modular Project Structure

## 📁 Project Structure

```
Capstone/
├── index.html              # Main entry point
├── components/             # Reusable UI components
│   ├── header.html         # Page header with title and date
│   ├── sidebar.html        # Navigation sidebar
│   └── modals.html         # All modal dialogs
├── pages/                  # Page-specific content
│   ├── dashboard.html      # Dashboard page
│   ├── inventory.html      # Inventory management page
│   ├── rooms.html          # Room rental management page
│   ├── accounting.html     # Accounting and transactions page
│   └── payment-summary.html # Payment summary page
├── scripts/                # JavaScript modules
│   ├── main.js             # Main application entry
│   ├── config.js           # Configuration and constants
│   ├── loader.js           # Component/page loader utilities
│   ├── navigation.js       # Navigation handling
│   ├── inventory.js        # Inventory management logic
│   ├── rooms.js            # Room management logic
│   └── bookings.js         # Booking/lease management logic
├── styles/                 # CSS files
├── assets/                 # Images, icons, etc.
├── animation/              # Legacy animation scripts
└── css/                    # Existing styles

## 🚀 Features

### Modular Architecture
- **Components**: Reusable UI elements (sidebar, header, modals)
- **Pages**: Separate HTML files for each main section
- **Scripts**: ES6 modules for clean code organization

### Key Benefits
1. **Easy Maintenance**: Each feature is isolated in its own module
2. **Better Organization**: Clear separation of concerns
3. **Reusability**: Components can be used across different pages
4. **Scalability**: Easy to add new features or pages

## 🔧 How It Works

### 1. Entry Point (`index.html`)
- Loads external libraries (Tailwind, Supabase, SweetAlert2, etc.)
- Contains placeholder divs for components
- Imports the main application script

### 2. Component Loading
The application dynamically loads components:
```javascript
await loadComponent('components/sidebar.html', 'sidebar');
await loadComponent('components/header.html', 'header');
await loadComponent('components/modals.html', 'modals');
```

### 3. Page Navigation
Each nav button loads its corresponding page:
```javascript
await loadPage('pages/dashboard.html', 'mainContent');
```

### 4. Module System
ES6 modules export/import functionality:
```javascript
// In inventory.js
export async function loadInventory() { ... }

// In main.js
import { loadInventory } from './inventory.js';
```

## 📋 Module Descriptions

### `config.js`
- Supabase configuration
- Department name mappings
- Global constants

### `loader.js`
- `loadComponent()`: Loads HTML components
- `loadPage()`: Loads page content
- `showSection()`: Shows/hides sections

### `navigation.js`
- Initializes navigation buttons
- Handles page transitions
- Updates page titles

### `inventory.js`
- Load inventory from Supabase
- Render inventory table
- Add/delete/filter products
- Stock management

### `rooms.js`
- Load rooms from Supabase
- Render rooms table
- Add/delete rooms
- Update room dropdown

### `bookings.js`
- Load bookings/leases
- Render bookings table
- Create/end/delete leases
- Payment management

### `main.js`
- Application initialization
- Page-specific initialization functions
- Global function bindings

## 🎯 Usage

### Running the Application
1. Open `index.html` in a web browser
2. The application will automatically:
   - Load all components
   - Display the dashboard
   - Initialize navigation

### Adding a New Page
1. Create HTML file in `pages/` directory
2. Create corresponding JS module in `scripts/`
3. Add navigation button in `sidebar.html`
4. Register in `navigation.js`

### Adding a New Component
1. Create HTML file in `components/` directory
2. Load it in `main.js` using `loadComponent()`
3. Add initialization logic if needed

## 🔐 Configuration

Update Supabase credentials in `scripts/config.js`:
```javascript
export const config = {
    supabaseUrl: "YOUR_SUPABASE_URL",
    supabaseKey: "YOUR_SUPABASE_KEY"
};
```

## 🛠️ Development Tips

1. **Browser Console**: Check for errors during development
2. **Module Imports**: Use ES6 import/export syntax
3. **Async/Await**: Handle asynchronous operations properly
4. **Event Listeners**: Attach after page content is loaded
5. **Global Functions**: Bind to `window` for onclick handlers

## 📦 Dependencies

- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend and database
- **SweetAlert2**: Beautiful alerts
- **Chart.js**: Data visualization
- **jsPDF**: PDF generation

## 🔄 Migration from Original

The original monolithic `main.html` has been separated into:
- **Components**: Header, Sidebar, Modals
- **Pages**: Dashboard, Inventory, Rooms, Accounting, Payment Summary
- **Scripts**: Config, Loader, Navigation, Inventory, Rooms, Bookings

## 📝 Notes

- All external libraries remain the same
- Functionality is preserved from original
- Code is now more maintainable and scalable
- ES6 modules require a web server (not file://)

## 🚨 Known Issues

- Must be served via HTTP/HTTPS (not file protocol)
- Browser must support ES6 modules
- Some onclick handlers use global functions

## 🎓 Best Practices

1. Keep components small and focused
2. Use ES6 modules for organization
3. Handle errors gracefully
4. Document complex logic
5. Follow consistent naming conventions
