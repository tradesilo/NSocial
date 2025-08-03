/**
 * Search Engine Module
 * Handles all search and filtering functionality
 */

class SearchEngine {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.currentResults = [];
        this.activeFilters = {
            search: '',
            location: '',
            profession: '',
            cohort: '',
            tags: []
        };
    }

    /**
     * Perform search with current filters
     */
    search(filters = {}) {
        if (!this.dataLoader.processedData) {
            console.warn('No data loaded for search');
            return [];
        }

        // Update active filters
        this.activeFilters = { ...this.activeFilters, ...filters };
        
        let results = [...this.dataLoader.processedData];

        // Apply text search filter
        if (this.activeFilters.search) {
            results = this.applyTextSearch(results, this.activeFilters.search);
        }

        // Apply location filter
        if (this.activeFilters.location) {
            results = results.filter(member => 
                member.location_normalized === this.activeFilters.location
            );
        }

        // Apply profession filter
        if (this.activeFilters.profession) {
            results = results.filter(member => 
                member.professional_summary && 
                member.professional_summary.toLowerCase().includes(this.activeFilters.profession.toLowerCase())
            );
        }



        // Apply tags filter
        if (this.activeFilters.tags.length > 0) {
            results = results.filter(member => 
                member.tags && this.activeFilters.tags.some(tag => 
                    member.tags.some(memberTag => 
                        memberTag.toLowerCase().includes(tag.toLowerCase())
                    )
                )
            );
        }

        this.currentResults = results;
        return results;
    }

    /**
     * Apply text search across multiple fields
     */
    applyTextSearch(data, searchTerm) {
        if (!searchTerm.trim()) return data;

        const terms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return data.filter(member => {
            return terms.every(term => {
                return member.searchable_text.includes(term) ||
                       this.fuzzyMatch(member.searchable_text, term);
            });
        }).map(member => {
            // Add relevance score
            const relevanceScore = this.calculateRelevanceScore(member, terms);
            return { ...member, relevanceScore };
        });
    }

    /**
     * Simple fuzzy matching for typos
     */
    fuzzyMatch(text, term) {
        // Simple implementation - could be enhanced with proper fuzzy search
        if (term.length < 4) return false;
        
        const words = text.split(' ');
        return words.some(word => {
            if (word.length < 3) return false;
            const similarity = this.stringSimilarity(word, term);
            return similarity > 0.7; // 70% similarity threshold
        });
    }

    /**
     * Calculate string similarity (simple implementation)
     */
    stringSimilarity(a, b) {
        if (a === b) return 1;
        if (a.length === 0 || b.length === 0) return 0;
        
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        
        if (longer.length === 0) return 1;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }

    /**
     * Calculate relevance score for search results
     */
    calculateRelevanceScore(member, searchTerms) {
        let score = 0;
        
        searchTerms.forEach(term => {
            // Higher score for matches in name
            if (member.name && member.name.toLowerCase().includes(term)) {
                score += 10;
            }
            
            // Medium score for matches in professional summary
            if (member.professional_summary && member.professional_summary.toLowerCase().includes(term)) {
                score += 5;
            }
            
            // Medium score for tag matches
            if (member.tags && member.tags.some(tag => tag.toLowerCase().includes(term))) {
                score += 5;
            }
            
            // Lower score for matches in other fields
            if (member.personal_summary && member.personal_summary.toLowerCase().includes(term)) {
                score += 2;
            }
            
            if (member.location && member.location.toLowerCase().includes(term)) {
                score += 3;
            }
        });
        
        return score;
    }

    /**
     * Advanced semantic search using embeddings (for future implementation)
     */
    async semanticSearch(query, topK = 50) {
        // This would require embedding the query and calculating cosine similarity
        // For now, return empty array as placeholder
        console.log('Semantic search not yet implemented');
        return [];
    }

    /**
     * Find similar members based on another member's profile
     */
    findSimilarMembers(targetMember, count = 10) {
        if (!targetMember || !this.dataLoader.processedData) return [];
        
        const similarities = this.dataLoader.processedData
            .filter(member => member.username !== targetMember.username)
            .map(member => ({
                ...member,
                similarityScore: this.calculateProfileSimilarity(targetMember, member)
            }))
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, count);
        
        return similarities;
    }

    /**
     * Calculate profile similarity between two members
     */
    calculateProfileSimilarity(member1, member2) {
        let score = 0;
        
        // Location similarity
        if (member1.location_normalized === member2.location_normalized) {
            score += 0.3;
        }
        

        
        // Tag overlap
        if (member1.tags && member2.tags) {
            const commonTags = member1.tags.filter(tag => 
                member2.tags.some(tag2 => tag2.toLowerCase() === tag.toLowerCase())
            );
            score += (commonTags.length / Math.max(member1.tags.length, member2.tags.length)) * 0.4;
        }
        
        // Professional keywords overlap
        if (member1.professional_keywords && member2.professional_keywords) {
            const commonKeywords = member1.professional_keywords.filter(keyword => 
                member2.professional_keywords.includes(keyword)
            );
            score += (commonKeywords.length / Math.max(member1.professional_keywords.length, member2.professional_keywords.length)) * 0.1;
        }
        
        return score;
    }

    /**
     * Sort results by different criteria
     */
    sortResults(results, sortBy = 'name') {
        const sorted = [...results];
        
        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            case 'recent':
                return sorted.sort((a, b) => (b.post_date || 0) - (a.post_date || 0));
            
            default:
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
    }

    /**
     * Get trending tags based on usage frequency
     */
    getTrendingTags(limit = 20) {
        if (!this.dataLoader.processedData) return [];
        
        const tagCounts = {};
        
        this.dataLoader.processedData.forEach(member => {
            if (member.tags) {
                member.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        return Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.activeFilters = {
            search: '',
            location: '',
            profession: '',
            tags: []
        };
        
        return this.search();
    }

    /**
     * Get current active filters for display
     */
    getActiveFilters() {
        const active = {};
        
        Object.entries(this.activeFilters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                active[key] = value;
            } else if (typeof value === 'string' && value.trim()) {
                active[key] = value;
            }
        });
        
        return active;
    }

    /**
     * Get search suggestions based on partial input
     */
    getSearchSuggestions(partial) {
        if (!partial || partial.length < 2) return [];
        
        const suggestions = [];
        const partialLower = partial.toLowerCase();
        
        // Suggest locations
        const filterOptions = this.dataLoader.getFilterOptions();
        if (filterOptions) {
            filterOptions.locations.forEach(location => {
                if (location.includes(partialLower)) {
                    suggestions.push({
                        type: 'location',
                        text: location,
                        display: `📍 ${location}`
                    });
                }
            });
            
            // Suggest tags
            filterOptions.tags.forEach(tag => {
                if (tag.toLowerCase().includes(partialLower)) {
                    suggestions.push({
                        type: 'tag',
                        text: tag,
                        display: `🏷️ ${tag}`
                    });
                }
            });
        }
        
        return suggestions.slice(0, 8); // Limit suggestions
    }
}

// Export for use in other modules
window.SearchEngine = SearchEngine;