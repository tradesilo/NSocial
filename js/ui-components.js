/**
 * UI Components Module
 * Handles all UI rendering and interactions
 */

class UIComponents {
    constructor() {
        this.currentView = 'grid'; // 'grid' or 'list'
        this.selectedTags = [];
    }

    /**
     * Render member cards in grid or list view
     */
    renderMemberCards(members, container, viewMode = 'grid') {
        if (!container) return;
        
        if (members.length === 0) {
            container.innerHTML = '';
            return;
        }

        if (viewMode === 'list') {
            this.renderMemberList(members, container);
        } else {
            this.renderMemberGrid(members, container);
        }
        
        // Add click listeners to cards
        container.querySelectorAll('.member-card, .member-list-item').forEach(card => {
            card.addEventListener('click', () => {
                const username = card.dataset.username;
                const member = members.find(m => m.username === username);
                if (member) {
                    this.showMemberProfile(member);
                }
            });
        });
    }

    /**
     * Render member cards in grid view
     */
    renderMemberGrid(members, container) {
        const cardsHtml = members.map(member => this.createMemberCard(member)).join('');
        container.innerHTML = cardsHtml;
        container.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
    }

    /**
     * Render member cards in list view
     */
    renderMemberList(members, container) {
        const listHtml = members.map(member => this.createMemberListItem(member)).join('');
        container.innerHTML = listHtml;
        container.className = 'space-y-4';
    }

    /**
     * Create member list item for list view
     */
    createMemberListItem(member) {
        const name = member.name || member.username || 'Anonymous';
        const location = member.location || '';
        const profileImage = member.profile_image || this.getDefaultAvatar(name);
        const tags = (member.tags || []).slice(0, 5); // Show max 5 tags in list view
        const professionalSummary = this.truncateText(member.professional_summary || '', 200);
        
        return `
            <div class="member-list-item bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 cursor-pointer p-4" 
                 data-username="${member.username}">
                <div class="flex items-start gap-4">
                    <img src="${profileImage}" 
                         alt="${name}" 
                         class="w-12 h-12 rounded-full object-cover bg-gray-200 flex-shrink-0"
                         onerror="this.src='${this.getDefaultAvatar(name)}'">
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="text-lg font-semibold text-gray-900 truncate">${name}</h3>
                            ${member.relevanceScore ? `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Match: ${Math.round(member.relevanceScore)}%</span>` : ''}
                        </div>
                        
                        ${location ? `
                            <div class="flex items-center text-gray-600 text-sm mb-2">
                                <i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>
                                <span class="truncate">${location}</span>
                            </div>
                        ` : ''}
                        
                        ${professionalSummary ? `
                            <p class="text-gray-700 text-sm mb-2 line-clamp-2">${professionalSummary}</p>
                        ` : ''}
                        
                        <div class="flex flex-wrap gap-2">
                            ${tags.map(tag => `
                                <span class="tag-chip text-white text-xs px-2 py-1 rounded-full">${tag}</span>
                            `).join('')}
                            ${member.tags && member.tags.length > 5 ? `
                                <span class="text-xs text-gray-500 px-2 py-1">+${member.tags.length - 5} more</span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="flex-shrink-0 flex items-center">
                        ${this.createCompactSocialLinks(member.social_links)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create individual member card HTML
     */
    createMemberCard(member) {
        const name = member.name || member.username || 'Anonymous';
        const location = member.location || '';
        const profileImage = member.profile_image || this.getDefaultAvatar(name);
        const tags = (member.tags || []).slice(0, 3); // Show max 3 tags
        const professionalSummary = this.truncateText(member.professional_summary || '', 120);
        
        return `
            <div class="member-card bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 cursor-pointer p-6" 
                 data-username="${member.username}">
                <div class="flex items-start gap-4">
                    <img src="${profileImage}" 
                         alt="${name}" 
                         class="w-16 h-16 rounded-full object-cover bg-gray-200"
                         onerror="this.src='${this.getDefaultAvatar(name)}'">
                    
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-lg font-semibold text-gray-900 truncate">${name}</h3>
                            ${member.relevanceScore ? `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Match: ${Math.round(member.relevanceScore)}%</span>` : ''}
                        </div>
                        
                        ${location ? `
                            <div class="flex items-center text-gray-600 text-sm mb-2">
                                <i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>
                                <span class="truncate">${location}</span>
                            </div>
                        ` : ''}
                        
                        ${professionalSummary ? `
                            <p class="text-gray-700 text-sm mb-3 line-clamp-3">${professionalSummary}</p>
                        ` : ''}
                        
                        <div class="flex flex-wrap gap-2">
                            ${tags.map(tag => `
                                <span class="tag-chip text-white text-xs px-2 py-1 rounded-full">${tag}</span>
                            `).join('')}
                            ${member.tags && member.tags.length > 3 ? `
                                <span class="text-xs text-gray-500 px-2 py-1">+${member.tags.length - 3} more</span>
                            ` : ''}
                        </div>
                        
                        ${this.createSocialLinks(member.social_links)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create social links HTML
     */
    createSocialLinks(socialLinks) {
        if (!socialLinks || Object.keys(socialLinks).length === 0) return '';
        
        const links = [];
        if (socialLinks.twitter) {
            links.push(`<a href="${socialLinks.twitter}" target="_blank" class="text-blue-500 hover:text-blue-600"><i class="fab fa-twitter"></i></a>`);
        }
        if (socialLinks.linkedin) {
            links.push(`<a href="${socialLinks.linkedin}" target="_blank" class="text-blue-700 hover:text-blue-800"><i class="fab fa-linkedin"></i></a>`);
        }
        if (socialLinks.discord) {
            links.push(`<span class="text-indigo-600" title="Discord: ${socialLinks.discord}"><i class="fab fa-discord"></i></span>`);
        }
        
        return links.length > 0 ? `
            <div class="flex gap-3 mt-2 pt-2 border-t border-gray-100">
                ${links.join('')}
            </div>
        ` : '';
    }

    /**
     * Create compact social links for list view
     */
    createCompactSocialLinks(socialLinks) {
        if (!socialLinks || Object.keys(socialLinks).length === 0) return '';
        
        const links = [];
        if (socialLinks.twitter) {
            links.push(`<a href="${socialLinks.twitter}" target="_blank" class="text-blue-500 hover:text-blue-600 p-1"><i class="fab fa-twitter"></i></a>`);
        }
        if (socialLinks.linkedin) {
            links.push(`<a href="${socialLinks.linkedin}" target="_blank" class="text-blue-700 hover:text-blue-800 p-1"><i class="fab fa-linkedin"></i></a>`);
        }
        if (socialLinks.discord) {
            links.push(`<span class="text-indigo-600 p-1" title="Discord: ${socialLinks.discord}"><i class="fab fa-discord"></i></span>`);
        }
        
        return `<div class="flex gap-1">${links.join('')}</div>`;
    }

    /**
     * Show member profile in modal
     */
    showMemberProfile(member) {
        const modal = document.getElementById('profile-modal');
        const content = document.getElementById('profile-content');
        
        if (!modal || !content) return;
        
        const name = member.name || member.username || 'Anonymous';
        const location = member.location || 'Location not specified';
        const profileImage = member.profile_image || this.getDefaultAvatar(name);
        const tags = member.tags || [];
        
        content.innerHTML = `
            <div class="relative">
                <!-- Header -->
                <div class="bg-gradient-to-r from-black to-gray-800 text-white p-6 rounded-t-2xl">
                    <button class="absolute top-4 right-4 text-white hover:text-gray-200 text-xl" onclick="this.closest('#profile-modal').classList.add('hidden')">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="flex items-center gap-4">
                        <img src="${profileImage}" 
                             alt="${name}" 
                             class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                             onerror="this.src='${this.getDefaultAvatar(name)}'">
                        <div>
                            <h2 class="text-2xl font-bold mb-1">${name}</h2>
                            <div class="flex items-center text-gray-200">
                                <i class="fas fa-map-marker-alt mr-2"></i>
                                <span>${location}</span>
                            </div>

                        </div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <!-- Professional Summary -->
                    ${member.professional_summary ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-briefcase text-black mr-2"></i>
                                Professional Background
                            </h3>
                            <p class="text-gray-700 leading-relaxed">${member.professional_summary}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Personal Summary -->
                    ${member.personal_summary ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-user text-black mr-2"></i>
                                Personal Interests
                            </h3>
                            <p class="text-gray-700 leading-relaxed">${member.personal_summary}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Philosophical Summary -->
                    ${member.philosophical_summary ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-lightbulb text-black mr-2"></i>
                                Philosophy & Values
                            </h3>
                            <p class="text-gray-700 leading-relaxed">${member.philosophical_summary}</p>
                        </div>
                    ` : ''}
                    
                    <!-- Tags -->
                    ${tags.length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-tags text-black mr-2"></i>
                                Skills & Interests
                            </h3>
                            <div class="flex flex-wrap gap-2">
                                ${tags.map(tag => `<span class="tag-chip text-white text-sm px-3 py-1 rounded-full">${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Social Links -->
                    ${Object.keys(member.social_links || {}).length > 0 ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-link text-black mr-2"></i>
                                Connect
                            </h3>
                            <div class="flex gap-4">
                                ${member.social_links.twitter ? `
                                    <a href="${member.social_links.twitter}" target="_blank" 
                                       class="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                        <i class="fab fa-twitter"></i>
                                        Twitter
                                    </a>
                                ` : ''}
                                ${member.social_links.linkedin ? `
                                    <a href="${member.social_links.linkedin}" target="_blank" 
                                       class="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                                        <i class="fab fa-linkedin"></i>
                                        LinkedIn
                                    </a>
                                ` : ''}
                                ${member.social_links.discord ? `
                                    <div class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
                                        <i class="fab fa-discord"></i>
                                        ${member.social_links.discord}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Original Introduction -->
                    ${member.original_text ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-quote-left text-black mr-2"></i>
                                Original Introduction
                            </h3>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <p class="text-gray-700 leading-relaxed italic">"${member.original_text}"</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    /**
     * Populate filter dropdowns
     */
    populateFilters(filterOptions) {
        if (!filterOptions) return;
        
        // Populate location filter
        const locationSelect = document.getElementById('location-filter');
        if (locationSelect) {
            locationSelect.innerHTML = '<option value="">All Locations</option>';
            filterOptions.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = this.capitalizeWords(location);
                locationSelect.appendChild(option);
            });
        }
        
        // Populate profession filter
        const professionSelect = document.getElementById('profession-filter');
        if (professionSelect) {
            professionSelect.innerHTML = '<option value="">All Professions</option>';
            filterOptions.professions.forEach(profession => {
                const option = document.createElement('option');
                option.value = profession;
                option.textContent = this.capitalizeWords(profession);
                professionSelect.appendChild(option);
            });
        }
        

        
        // Populate tags
        this.populateTagsFilter(filterOptions.tags);
    }

    /**
     * Populate tags filter with clickable chips
     */
    populateTagsFilter(tags) {
        const container = document.getElementById('tags-container');
        if (!container) return;
        
        container.innerHTML = tags.map(tag => `
            <button class="tag-filter-chip text-xs px-3 py-1 rounded-full border transition-all duration-200 ${
                this.selectedTags.includes(tag) 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }" data-tag="${tag}">
                ${tag}
            </button>
        `).join('');
        
        // Add click listeners to tag chips
        container.querySelectorAll('.tag-filter-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = chip.dataset.tag;
                this.toggleTag(tag);
                
                // Trigger search with updated tags
                const event = new CustomEvent('filterChange', {
                    detail: { tags: this.selectedTags }
                });
                document.dispatchEvent(event);
            });
        });
    }

    /**
     * Toggle tag selection
     */
    toggleTag(tag) {
        const index = this.selectedTags.indexOf(tag);
        if (index > -1) {
            this.selectedTags.splice(index, 1);
        } else {
            this.selectedTags.push(tag);
        }
        
        // Update UI
        const chip = document.querySelector(`[data-tag="${tag}"]`);
        if (chip) {
            if (this.selectedTags.includes(tag)) {
                chip.className = 'tag-filter-chip text-xs px-3 py-1 rounded-full border transition-all duration-200 bg-black text-white border-black';
            } else {
                chip.className = 'tag-filter-chip text-xs px-3 py-1 rounded-full border transition-all duration-200 bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50';
            }
        }
    }

    /**
     * Update statistics display
     */
    updateStats(stats) {
        if (!stats) return;
        
        const elements = {
            'total-members': stats.totalMembers,
            'total-locations': stats.totalLocations
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toLocaleString();
            }
        });
        
        // Update member count in header
        const memberCount = document.getElementById('member-count');
        if (memberCount) {
            memberCount.textContent = `${stats.totalMembers.toLocaleString()} Network School members`;
        }
    }

    /**
     * Update results count and description
     */
    updateResultsInfo(count, total, activeFilters) {
        const countElement = document.getElementById('results-count');
        const descElement = document.getElementById('results-description');
        
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
        
        if (descElement) {
            if (Object.keys(activeFilters).length === 0) {
                descElement.textContent = 'Showing all Network School members';
            } else {
                const filterDescriptions = [];
                if (activeFilters.search) {
                    filterDescriptions.push(`matching "${activeFilters.search}"`);
                }
                if (activeFilters.location) {
                    filterDescriptions.push(`in ${this.capitalizeWords(activeFilters.location)}`);
                }
                if (activeFilters.profession) {
                    filterDescriptions.push(`working in ${activeFilters.profession}`);
                }

                if (activeFilters.tags && activeFilters.tags.length > 0) {
                    filterDescriptions.push(`with skills: ${activeFilters.tags.join(', ')}`);
                }
                
                descElement.textContent = `Filtered by: ${filterDescriptions.join(', ')}`;
            }
        }
    }

    /**
     * Utility functions
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    capitalizeWords(str) {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    }

    getDefaultAvatar(name) {
        // Generate a simple color-based avatar
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const colorIndex = (name || '').length % colors.length;
        const initials = (name || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
                <rect width="80" height="80" fill="${colors[colorIndex]}"/>
                <text x="40" y="45" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
                      text-anchor="middle" fill="white">${initials}</text>
            </svg>
        `)}`;
    }

    /**
     * Show/hide loading state
     */
    setLoadingState(isLoading) {
        const loadingElement = document.getElementById('loading-state');
        const resultsElement = document.getElementById('results-container');
        const noResultsElement = document.getElementById('no-results');
        
        if (isLoading) {
            loadingElement?.classList.remove('hidden');
            resultsElement?.classList.add('hidden');
            noResultsElement?.classList.add('hidden');
        } else {
            loadingElement?.classList.add('hidden');
        }
    }

    /**
     * Show no results state
     */
    showNoResults() {
        const loadingElement = document.getElementById('loading-state');
        const resultsElement = document.getElementById('results-container');
        const noResultsElement = document.getElementById('no-results');
        
        loadingElement?.classList.add('hidden');
        resultsElement?.classList.add('hidden');
        noResultsElement?.classList.remove('hidden');
    }

    /**
     * Show results
     */
    showResults() {
        const loadingElement = document.getElementById('loading-state');
        const resultsElement = document.getElementById('results-container');
        const noResultsElement = document.getElementById('no-results');
        
        loadingElement?.classList.add('hidden');
        resultsElement?.classList.remove('hidden');
        noResultsElement?.classList.add('hidden');
    }
}

// Export for use in other modules
window.UIComponents = UIComponents;