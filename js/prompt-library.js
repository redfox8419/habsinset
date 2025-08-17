// Prompt Library JavaScript
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    increment,
    orderBy,
    query 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, hasVoted, recordVote } from './firebase.js';
import { categories } from './categories.js';

class PromptLibrary {
    constructor() {
        this.prompts = [];
        this.filteredPrompts = [];
        this.filters = {
            subject: '',
            phase: '',
            type: ''
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.populateFilterDropdowns();
        await this.loadPrompts();
    }
    
    setupEventListeners() {
        // Filter events
        document.getElementById('subject-filter').addEventListener('change', (e) => {
            this.filters.subject = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('phase-filter').addEventListener('change', (e) => {
            this.filters.phase = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('type-filter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
        
        // Modal events
        document.getElementById('add-prompt-btn').addEventListener('click', () => {
            this.showAddModal();
        });
        
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideAddModal();
        });
        
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.hideAddModal();
        });
        
        document.getElementById('add-prompt-form').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });
        
        // Close modal on background click
        document.getElementById('add-prompt-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-prompt-modal') {
                this.hideAddModal();
            }
        });
    }
    
    populateFilterDropdowns() {
        const subjectFilter = document.getElementById('subject-filter');
        const phaseFilter = document.getElementById('phase-filter');
        const typeFilter = document.getElementById('type-filter');
        
        const promptSubject = document.getElementById('prompt-subject');
        const promptPhase = document.getElementById('prompt-phase');
        const promptType = document.getElementById('prompt-type');
        
        // Populate filter dropdowns
        categories.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option.cloneNode(true));
            promptSubject.appendChild(option);
        });
        
        categories.phases.forEach(phase => {
            const option = document.createElement('option');
            option.value = phase;
            option.textContent = phase;
            phaseFilter.appendChild(option.cloneNode(true));
            promptPhase.appendChild(option);
        });
        
        categories.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option.cloneNode(true));
            promptType.appendChild(option);
        });
    }
    
    async loadPrompts() {
        try {
            document.getElementById('loading').style.display = 'block';
            
            const q = query(collection(db, 'prompts'), orderBy('votes', 'desc'));
            const snapshot = await getDocs(q);
            
            this.prompts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.applyFilters();
            
        } catch (error) {
            console.error('Error loading prompts:', error);
            this.showError('Failed to load prompts. Please try again.');
        } finally {
            document.getElementById('loading').style.display = 'none';
        }
    }
    
    applyFilters() {
        this.filteredPrompts = this.prompts.filter(prompt => {
            return (!this.filters.subject || prompt.subject === this.filters.subject) &&
                   (!this.filters.phase || prompt.phase === this.filters.phase) &&
                   (!this.filters.type || prompt.type === this.filters.type);
        });
        
        this.renderPrompts();
        this.updateClearFiltersButton();
    }
    
    clearFilters() {
        this.filters = { subject: '', phase: '', type: '' };
        document.getElementById('subject-filter').value = '';
        document.getElementById('phase-filter').value = '';
        document.getElementById('type-filter').value = '';
        this.applyFilters();
    }
    
    updateClearFiltersButton() {
        const hasFilters = this.filters.subject || this.filters.phase || this.filters.type;
        document.getElementById('clear-filters').style.display = hasFilters ? 'block' : 'none';
    }
    
    renderPrompts() {
        const container = document.getElementById('prompts-container');
        const noResults = document.getElementById('no-results');
        
        if (this.filteredPrompts.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        
        container.innerHTML = this.filteredPrompts.map(prompt => `
            <div class="content-container" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <h3 style="color: var(--dark); margin-bottom: 0.5rem; font-size: 1.3rem;">${this.escapeHtml(prompt.title)}</h3>
                        <p style="color: var(--neutral); margin: 0 0 1rem 0; line-height: 1.5;">${this.escapeHtml(prompt.description)}</p>
                    </div>
                    <button 
                        onclick="promptLibrary.handleVote('${prompt.id}')" 
                        ${hasVoted(prompt.id) ? 'disabled' : ''}
                        style="
                            display: flex; 
                            align-items: center; 
                            gap: 0.5rem; 
                            padding: 0.5rem 1rem; 
                            margin-left: 1rem;
                            border: none; 
                            border-radius: var(--radius); 
                            cursor: ${hasVoted(prompt.id) ? 'not-allowed' : 'pointer'};
                            background-color: ${hasVoted(prompt.id) ? 'var(--secondary)' : 'var(--light)'};
                            color: ${hasVoted(prompt.id) ? 'white' : 'var(--neutral)'};
                            font-weight: 600;
                            transition: all 0.2s ease;
                        "
                        ${!hasVoted(prompt.id) ? 'onmouseover="this.style.backgroundColor=\'var(--neutral-light)\'"' : ''}
                        ${!hasVoted(prompt.id) ? 'onmouseout="this.style.backgroundColor=\'var(--light)\'"' : ''}
                    >
                        <span>${hasVoted(prompt.id) ? '✅' : '👍'}</span>
                        <span>${prompt.votes || 0}</span>
                    </button>
                </div>
                
                <div style="background-color: var(--light); border-radius: var(--radius); padding: 1rem; margin-bottom: 1rem; position: relative;">
                    <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 0.9rem; color: var(--dark); margin: 0; line-height: 1.4;">${this.escapeHtml(prompt.content)}</pre>
                    <button 
                        onclick="promptLibrary.copyToClipboard('${prompt.id}')" 
                        style="
                            position: absolute; 
                            top: 0.5rem; 
                            right: 0.5rem; 
                            background: white; 
                            border: 1px solid var(--neutral-light); 
                            border-radius: var(--radius); 
                            padding: 0.25rem 0.5rem; 
                            cursor: pointer; 
                            font-size: 0.8rem;
                            transition: all 0.2s ease;
                        "
                        onmouseover="this.style.backgroundColor='var(--primary)'; this.style.color='white'; this.style.borderColor='var(--primary)'"
                        onmouseout="this.style.backgroundColor='white'; this.style.color='var(--dark)'; this.style.borderColor='var(--neutral-light)'"
                    >
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    <span style="background-color: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500;">
                        ${this.escapeHtml(prompt.subject)}
                    </span>
                    <span style="background-color: rgba(16, 185, 129, 0.1); color: var(--secondary); padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500;">
                        ${this.escapeHtml(prompt.phase)}
                    </span>
                    <span style="background-color: rgba(168, 85, 247, 0.1); color: var(--tertiary); padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500;">
                        ${this.escapeHtml(prompt.type)}
                    </span>
                    <span style="background-color: var(--neutral-light); color: white; padding: 0.25rem 0.75rem; border-radius: 15px; font-size: 0.8rem; font-weight: 500;">
                        by ${this.escapeHtml(prompt.createdBy || 'Anonymous')}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    async handleVote(promptId) {
        if (hasVoted(promptId)) return;
        
        try {
            await updateDoc(doc(db, 'prompts', promptId), {
                votes: increment(1)
            });
            
            // Update local state
            const prompt = this.prompts.find(p => p.id === promptId);
            if (prompt) {
                prompt.votes = (prompt.votes || 0) + 1;
            }
            
            recordVote(promptId);
            this.renderPrompts();
            
        } catch (error) {
            console.error('Error voting:', error);
            this.showError('Failed to record vote. Please try again.');
        }
    }
    
    async copyToClipboard(promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (!prompt) return;
        
        try {
            await navigator.clipboard.writeText(prompt.content);
            this.showSuccess('Prompt copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showError('Failed to copy prompt.');
        }
    }
    
    showAddModal() {
        document.getElementById('add-prompt-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    hideAddModal() {
        document.getElementById('add-prompt-modal').style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('add-prompt-form').reset();
        document.getElementById('prompt-created-by').value = 'Anonymous';
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.textContent;
        
        try {
            submitBtn.textContent = 'Adding...';
            submitBtn.disabled = true;
            
            const formData = {
                title: document.getElementById('prompt-title').value.trim(),
                description: document.getElementById('prompt-description').value.trim(),
                content: document.getElementById('prompt-content').value.trim(),
                subject: document.getElementById('prompt-subject').value,
                phase: document.getElementById('prompt-phase').value,
                type: document.getElementById('prompt-type').value,
                createdBy: document.getElementById('prompt-created-by').value.trim() || 'Anonymous',
                votes: 0,
                createdAt: new Date()
            };
            
            await addDoc(collection(db, 'prompts'), formData);
            
            this.hideAddModal();
            this.showSuccess('Prompt added successfully!');
            await this.loadPrompts();
            
        } catch (error) {
            console.error('Error adding prompt:', error);
            this.showError('Failed to add prompt. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            color: white;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease-out;
            background-color: ${type === 'success' ? 'var(--secondary)' : 'var(--tertiary)'};
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the prompt library
const promptLibrary = new PromptLibrary();

// Make it globally accessible for onclick handlers
window.promptLibrary = promptLibrary;