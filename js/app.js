/**
 * Main Application Module
 * Coordinates all components and handles app initialization
 */

class NSocialApp {
    constructor() {
        this.dataLoader = new DataLoader();
        this.searchEngine = null;
        this.ui = new UIComponents();
        this.currentSort = 'recent';
        this.currentView = 'grid';
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing NSocial Discovery App...');
        
        try {
            // Show loading state
            this.ui.setLoadingState(true);
            
            // Load data
            await this.dataLoader.loadData();
            this.searchEngine = new SearchEngine(this.dataLoader);
            
            // Setup UI
            this.setupUI();
            this.setupEventListeners();
            
            // Initial data load
            this.performInitialLoad();
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorState(error);
        }
    }

    /**
     * Setup initial UI state
     */
    setupUI() {
        // Populate filter options
        const filterOptions = this.dataLoader.getFilterOptions();
        this.ui.populateFilters(filterOptions);
        
        // Update statistics
        const stats = this.dataLoader.getStats();
        this.ui.updateStats(stats);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            // Real-time search with debouncing
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch({ search: e.target.value });
                }, 300);
            });
            
            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch({ search: e.target.value });
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput?.value || '';
                this.performSearch({ search: query });
            });
        }
        
        // Filter dropdowns
        this.setupFilterListeners();
        
        // View toggle buttons
        this.setupViewToggle();
        
        // Sort selector
        this.setupSortListener();
        
        // Clear filters button
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Reset search button (in no results state)
        const resetBtn = document.getElementById('reset-search');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Custom filter change events
        document.addEventListener('filterChange', (e) => {
            this.performSearch(e.detail);
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('profile-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            }
        });
    }

    /**
     * Setup filter dropdown listeners
     */
    setupFilterListeners() {
        const filters = ['location-filter', 'profession-filter'];
        
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.performSearch();
                });
            }
        });
    }

    /**
     * Setup view toggle functionality
     */
    setupViewToggle() {
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                this.setView('grid');
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.setView('list');
            });
        }
    }

    /**
     * Setup sort functionality
     */
    setupSortListener() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.refreshResults();
            });
        }
    }

    /**
     * Perform initial data load and display
     */
    performInitialLoad() {
        // Show all members initially
        const allMembers = this.dataLoader.processedData;
        this.displayResults(allMembers);
        this.ui.setLoadingState(false);
        
        // Set default sort option
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = 'recent';
        }
    }

    /**
     * Perform search with current filter values
     */
    performSearch(additionalFilters = {}) {
        if (!this.searchEngine) return;
        
        // Gather current filter values
        const filters = this.getCurrentFilters();
        
        // Apply additional filters
        Object.assign(filters, additionalFilters);
        
        // Perform search
        const results = this.searchEngine.search(filters);
        
        // Display results
        this.displayResults(results);
    }

    /**
     * Get current filter values from UI
     */
    getCurrentFilters() {
        const searchInput = document.getElementById('search-input');
        const locationFilter = document.getElementById('location-filter');
        const professionFilter = document.getElementById('profession-filter');
        
        return {
            search: searchInput?.value || '',
            location: locationFilter?.value || '',
            profession: professionFilter?.value || '',
            tags: this.ui.selectedTags || []
        };
    }

    /**
     * Display search results
     */
    displayResults(results) {
        const sortedResults = this.searchEngine.sortResults(results, this.currentSort);
        
        if (sortedResults.length === 0) {
            this.ui.showNoResults();
        } else {
            this.ui.showResults();
            
            // Render results based on current view
            const container = document.getElementById('results-grid');
            this.ui.renderMemberCards(sortedResults, container, this.currentView);
        }
        
        // Update results info
        const activeFilters = this.searchEngine.getActiveFilters();
        const totalMembers = this.dataLoader.processedData.length;
        this.ui.updateResultsInfo(sortedResults.length, totalMembers, activeFilters);
    }

    /**
     * Refresh results with current filters and sort
     */
    refreshResults() {
        const results = this.searchEngine.currentResults;
        this.displayResults(results);
    }

    /**
     * Set view mode (grid or list)
     */
    setView(view) {
        this.currentView = view;
        
        // Update button states
        const gridBtn = document.getElementById('grid-view');
        const listBtn = document.getElementById('list-view');
        
        if (gridBtn && listBtn) {
            if (view === 'grid') {
                gridBtn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm';
                listBtn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900';
            } else {
                gridBtn.className = 'px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900';
                listBtn.className = 'px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-900 shadow-sm';
            }
        }
        
        // Refresh display
        this.refreshResults();
    }

    /**
     * Clear all filters and reset to initial state
     */
    clearAllFilters() {
        // Clear UI elements
        const searchInput = document.getElementById('search-input');
        const locationFilter = document.getElementById('location-filter');
        const professionFilter = document.getElementById('profession-filter');
        
        if (searchInput) searchInput.value = '';
        if (locationFilter) locationFilter.value = '';
        if (professionFilter) professionFilter.value = '';
        
        // Clear selected tags
        this.ui.selectedTags = [];
        const tagsContainer = document.getElementById('tags-container');
        if (tagsContainer) {
            tagsContainer.querySelectorAll('.tag-filter-chip').forEach(chip => {
                chip.className = 'tag-filter-chip text-xs px-3 py-1 rounded-full border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50';
            });
        }
        
        // Clear search engine filters
        if (this.searchEngine) {
            const results = this.searchEngine.clearFilters();
            this.displayResults(results);
        }
    }

    /**
     * Show error state
     */
    showErrorState(error) {
        const loadingElement = document.getElementById('loading-state');
        const resultsElement = document.getElementById('results-container');
        
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
                    <p class="text-gray-600 mb-4">There was an error loading the Network School member data.</p>
                    <p class="text-sm text-gray-500 mb-4">Error: ${error.message}</p>
                    <button onclick="location.reload()" class="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                        Try Again
                    </button>
                </div>
            `;
        }
        
        if (resultsElement) {
            resultsElement.classList.add('hidden');
        }
    }

    /**
     * Utility method to search for specific member
     */
    findMember(username) {
        if (!this.dataLoader.processedData) return null;
        return this.dataLoader.processedData.find(member => member.username === username);
    }

    /**
     * Get recommendations for a specific member
     */
    getRecommendations(username, count = 5) {
        const member = this.findMember(username);
        if (!member || !this.searchEngine) return [];
        
        return this.searchEngine.findSimilarMembers(member, count);
    }

    /**
     * Export current search results
     */
    exportResults() {
        if (!this.searchEngine.currentResults) return;
        
        const dataStr = JSON.stringify(this.searchEngine.currentResults, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'nsocial-search-results.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Get app statistics for debugging
     */
    getDebugInfo() {
        return {
            totalMembers: this.dataLoader.processedData?.length || 0,
            currentResults: this.searchEngine?.currentResults?.length || 0,
            activeFilters: this.searchEngine?.getActiveFilters() || {},
            selectedTags: this.ui.selectedTags,
            currentSort: this.currentSort,
            currentView: this.currentView,
            stats: this.dataLoader.getStats()
        };
    }
}

// Global app instance
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app = new NSocialApp();
});

// Make app available globally for debugging
window.NSocialApp = NSocialApp;
window.getAppInstance = () => app;