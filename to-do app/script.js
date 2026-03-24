document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const dateDisplay = document.getElementById('date-display');

    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    // Initialize
    updateDate();
    renderTodos();

    // Event Listeners
    form.addEventListener('submit', addTodo);
    todoList.addEventListener('click', handleTodoClick);
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active styling
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update filter and render
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Functions
    function updateDate() {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    }

    function addTodo(e) {
        e.preventDefault();
        const text = input.value.trim();
        
        if (text) {
            const newTodo = {
                id: Date.now().toString(),
                text,
                completed: false
            };
            
            todos.push(newTodo);
            saveTodos();
            renderTodos();
            input.value = '';
        }
    }

    function handleTodoClick(e) {
        // Toggle completion
        if (e.target.classList.contains('todo-checkbox')) {
            const id = e.target.closest('.todo-item').dataset.id;
            toggleTodo(id);
        }
        
        // Delete todo
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const id = e.target.closest('.todo-item').dataset.id;
            const item = e.target.closest('.todo-item');
            
            // Add fade out animation
            item.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                deleteTodo(id);
            }, 300);
        }
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id) {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    }

    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function updateItemsLeft() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    function renderTodos() {
        let filteredTodos = todos;
        
        if (currentFilter === 'active') {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(todo => todo.completed);
        }

        todoList.innerHTML = '';

        if (todos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks yet. Add one above!</p>
                </div>
            `;
            updateItemsLeft();
            return;
        }

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <p>No ${currentFilter === 'active' ? 'active' : 'completed'} tasks found.</p>
                </div>
            `;
            updateItemsLeft();
            return;
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.dataset.id = todo.id;
            
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${escapeHTML(todo.text)}</span>
                <button class="delete-btn">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            todoList.appendChild(li);
        });

        updateItemsLeft();
    }

    // Helper to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
