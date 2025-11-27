// Component Loader Module
export async function loadComponent(componentPath, targetElementId) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        const html = await response.text();
        document.getElementById(targetElementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

export async function loadPage(pagePath, targetElementId) {
    try {
        const response = await fetch(pagePath);
        if (!response.ok) throw new Error(`Failed to load ${pagePath}`);
        const html = await response.text();
        document.getElementById(targetElementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading page ${pagePath}:`, error);
    }
}

export function showSection(sectionName) {
    // Hide all sections
    const sections = ['dashboardSection', 'inventorySection', 'roomRentalSection', 'accountingSection', 'paymentSummarySection'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add('hidden');
    });

    // Show requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
}
