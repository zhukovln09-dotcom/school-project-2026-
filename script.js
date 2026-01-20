// Основной объект приложения
const CrowdsourcingApp = {
    // Данные приложения
    data: {
        ideas: [],
        users: [
            { id: 1, name: "Алексей Петров", role: "student", avatar: "👨‍🎓" },
            { id: 2, name: "Мария Иванова", role: "student", avatar: "👩‍🎓" },
            { id: 3, name: "Сергей Смирнов", role: "teacher", avatar: "👨‍🏫" },
            { id: 4, name: "Ольга Васильева", role: "admin", avatar: "👩‍💼" }
        ],
        currentUser: null,
        categories: {
            infrastructure: { name: "Инфраструктура", color: "#ffeaa7", textColor: "#d35400" },
            events: { name: "Мероприятия", color: "#a29bfe", textColor: "#2d3436" },
            education: { name: "Учебный процесс", color: "#81ecec", textColor: "#006266" },
            technology: { name: "Технологии", color: "#fab1a0", textColor: "#c23616" },
            other: { name: "Другое", color: "#dfe6e9", textColor: "#636e72" }
        },
        statuses: {
            new: { name: "Новая", color: "#dff9fb", textColor: "#00a8ff" },
            active: { name: "Активная", color: "#d1f7c4", textColor: "#2ecc71" },
            planned: { name: "Запланирована", color: "#fff0f6", textColor: "#e84393" },
            implemented: { name: "Воплощена", color: "#e8f4fc", textColor: "#3498db" }
        }
    },

    // Инициализация приложения
    init: function() {
        this.loadData();
        this.setupEventListeners();
        this.setupNavigation();
        this.setDefaultUser();
        this.updateStats();
        this.displayFeaturedIdeas();
        this.displayAllIdeas();
        this.setupCharts();
    },

    // Загрузка данных (в реальном проекте было бы API)
    loadData: function() {
        // Пример данных идей
        this.data.ideas = [
            {
                id: 1,
                title: "Организовать школьный киноклуб",
                description: "Предлагаю создать школьный киноклуб, где мы будем смотреть и обсуждать фильмы раз в неделю после уроков. Это поможет развивать критическое мышление и культурный кругозор учеников.",
                benefits: "Ученики смогут расширить свой кругозор, научиться анализировать киноискусство, проводить время с пользой и интересно.",
                category: "events",
                authorId: 1,
                votes: 24,
                upvotedBy: [],
                comments: 8,
                status: "active",
                createdAt: "2024-02-15",
                updatedAt: "2024-03-10"
            },
            {
                id: 2,
                title: "Установить солнечные батареи на крыше школы",
                description: "Школа может стать более экологичной, установив солнечные батареи на крыше. Это сократит расходы на электричество и станет отличным примером заботы об окружающей среде.",
                benefits: "Экономия на электроэнергии, образовательный проект по экологии, сокращение углеродного следа школы.",
                category: "infrastructure",
                authorId: 2,
                votes: 42,
                upvotedBy: [],
                comments: 15,
                status: "planned",
                createdAt: "2024-01-20",
                updatedAt: "2024-03-05"
            },
            {
                id: 3,
                title: "Ввести курс программирования для всех классов",
                description: "В современном мире цифровые навыки необходимы каждому. Предлагаю ввести обязательный курс программирования для всех классов, адаптированный по возрасту.",
                benefits: "Развитие логического мышления, подготовка к профессиям будущего, повышение цифровой грамотности.",
                category: "education",
                authorId: 3,
                votes: 37,
                upvotedBy: [],
                comments: 22,
                status: "new",
                createdAt: "2024-03-01",
                updatedAt: "2024-03-01"
            },
            {
                id: 4,
                title: "Создать школьное радио",
                description: "Школьное радио могло бы объявлять важные события, транслировать музыку на переменах и давать возможность ученикам попробовать себя в роли ведущих.",
                benefits: "Развитие коммуникативных навыков, информирование школьного сообщества, создание позитивной атмосферы.",
                category: "technology",
                authorId: 1,
                votes: 19,
                upvotedBy: [],
                comments: 6,
                status: "implemented",
                createdAt: "2023-11-10",
                updatedAt: "2024-02-28"
            },
            {
                id: 5,
                title: "Организовать школьный огород",
                description: "На территории школы есть свободное пространство, которое можно использовать для создания школьного огорода. Ученики могли бы выращивать овощи и зелень.",
                benefits: "Практические знания по биологии, экологическое воспитание, свежие овощи для школьной столовой.",
                category: "infrastructure",
                authorId: 4,
                votes: 31,
                upvotedBy: [],
                comments: 12,
                status: "active",
                createdAt: "2024-02-28",
                updatedAt: "2024-03-12"
            },
            {
                id: 6,
                title: "Проводить ежемесячные научные стендапы",
                description: "Раз в месяц ученики могли бы представлять короткие (5-7 минут) презентации на интересные научные темы в формате стендапа. Это весело и познавательно.",
                benefits: "Развитие навыков публичных выступлений, популяризация науки, выявление талантливых учеников.",
                category: "events",
                authorId: 2,
                votes: 28,
                upvotedBy: [],
                comments: 9,
                status: "new",
                createdAt: "2024-03-05",
                updatedAt: "2024-03-05"
            }
        ];

        // Инициализация данных GitHub (заглушка)
        this.data.githubStats = {
            stars: 12,
            issues: 3,
            forks: 5
        };
    },

    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Кнопка входа
        document.getElementById('login-btn').addEventListener('click', () => {
            this.showModal('login-modal');
        });

        // Закрытие модальных окон
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });

        // Клик вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });

        // Вход как пользователь
        document.querySelectorAll('.login-as').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const role = e.target.getAttribute('data-role');
                this.loginAs(role);
            });
        });

        // Форма добавления идеи
        document.getElementById('idea-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIdea();
        });

        // Кнопка отмены в форме
        document.getElementById('cancel-form').addEventListener('click', () => {
            this.navigateTo('home');
        });

        // Кнопка добавления идеи на главной
        document.getElementById('add-idea-btn').addEventListener('click', () => {
            this.navigateTo('add');
        });

        // Форма GitHub issue
        document.getElementById('issue-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitGitHubIssue();
        });

        // Фильтры на странице идей
        document.getElementById('filter-status').addEventListener('change', () => {
            this.displayAllIdeas();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.displayAllIdeas();
        });

        document.getElementById('sort-ideas').addEventListener('change', () => {
            this.displayAllIdeas();
        });
    },

    // Настройка навигации
    setupNavigation: function() {
        document.getElementById('nav-home').addEventListener('click', () => this.navigateTo('home'));
        document.getElementById('nav-ideas').addEventListener('click', () => this.navigateTo('ideas'));
        document.getElementById('nav-add').addEventListener('click', () => this.navigateTo('add'));
        document.getElementById('nav-stats').addEventListener('click', () => this.navigateTo('stats'));
        document.getElementById('nav-github').addEventListener('click', () => this.navigateTo('github'));
    },

    // Навигация по страницам
    navigateTo: function(page) {
        // Скрыть все страницы
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Убрать активный класс у всех ссылок навигации
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });

        // Показать выбранную страницу
        let pageElement, navElement;

        switch(page) {
            case 'home':
                pageElement = document.getElementById('home-page');
                navElement = document.getElementById('nav-home');
                this.updateStats();
                this.displayFeaturedIdeas();
                break;
            case 'ideas':
                pageElement = document.getElementById('ideas-page');
                navElement = document.getElementById('nav-ideas');
                this.displayAllIdeas();
                break;
            case 'add':
                pageElement = document.getElementById('add-page');
                navElement = document.getElementById('nav-add');
                // Очистить форму, если пользователь не вошел
                if (!this.data.currentUser) {
                    this.showModal('login-modal');
                    this.navigateTo('home');
                    return;
                }
                break;
            case 'stats':
                pageElement = document.getElementById('stats-page');
                navElement = document.getElementById('nav-stats');
                this.updateCharts();
                this.displayTopIdeas();
                this.displayActivityFeed();
                break;
            case 'github':
                pageElement = document.getElementById('github-page');
                navElement = document.getElementById('nav-github');
                this.updateGitHubStats();
                break;
        }

        if (pageElement) {
            pageElement.classList.add('active');
            navElement.classList.add('active');
            
            // Прокрутить к верху страницы
            window.scrollTo(0, 0);
        }
    },

    // Установка пользователя по умолчанию
    setDefaultUser: function() {
        // По умолчанию пользователь не вошел
        this.data.currentUser = null;
        document.getElementById('username').textContent = 'Гость';
    },

    // Вход как определенная роль
    loginAs: function(role) {
        const user = this.data.users.find(u => u.role === role);
        if (user) {
            this.data.currentUser = user;
            document.getElementById('username').textContent = user.name.split(' ')[0];
            document.getElementById('login-btn').textContent = 'Выйти';
            
            // Изменить обработчик кнопки на выход
            document.getElementById('login-btn').onclick = () => {
                this.logout();
            };
            
            this.hideAllModals();
            this.showNotification(`Вы вошли как ${user.name}`, 'success');
        }
    },

    // Выход
    logout: function() {
        this.data.currentUser = null;
        document.getElementById('username').textContent = 'Гость';
        document.getElementById('login-btn').textContent = 'Войти';
        
        // Вернуть обработчик кнопки на вход
        document.getElementById('login-btn').onclick = () => {
            this.showModal('login-modal');
        };
        
        this.showNotification('Вы вышли из системы', 'info');
    },

    // Показать модальное окно
    showModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    // Скрыть все модальные окна
    hideAllModals: function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    // Отображение избранных идей
    displayFeaturedIdeas: function() {
        const container = document.getElementById('featured-ideas-list');
        if (!container) return;

        // Отсортировать идеи по количеству голосов
        const sortedIdeas = [...this.data.ideas].sort((a, b) => b.votes - a.votes);
        const featuredIdeas = sortedIdeas.slice(0, 3);

        container.innerHTML = featuredIdeas.map(idea => this.createIdeaCard(idea)).join('');
        
        // Добавить обработчики для кнопок голосования
        this.setupVoteButtons();
        
        // Добавить обработчики для открытия деталей идеи
        this.setupIdeaDetailButtons();
    },

    // Отображение всех идей
    displayAllIdeas: function() {
        const container = document.getElementById('all-ideas-list');
        if (!container) return;

        // Получить значения фильтров
        const statusFilter = document.getElementById('filter-status').value;
        const categoryFilter = document.getElementById('filter-category').value;
        const sortBy = document.getElementById('sort-ideas').value;

        // Отфильтровать идеи
        let filteredIdeas = this.data.ideas.filter(idea => {
            const statusMatch = statusFilter === 'all' || idea.status === statusFilter;
            const categoryMatch = categoryFilter === 'all' || idea.category === categoryFilter;
            return statusMatch && categoryMatch;
        });

        // Отсортировать идеи
        switch(sortBy) {
            case 'newest':
                filteredIdeas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'popular':
                filteredIdeas.sort((a, b) => b.votes - a.votes);
                break;
            case 'votes':
                filteredIdeas.sort((a, b) => b.votes - a.votes);
                break;
        }

        // Отобразить идеи
        container.innerHTML = filteredIdeas.map(idea => this.createIdeaCard(idea)).join('');
        
        // Добавить обработчики для кнопок голосования
        this.setupVoteButtons();
        
        // Добавить обработчики для открытия деталей идеи
        this.setupIdeaDetailButtons();
    },

    // Создание карточки идеи
    createIdeaCard: function(idea) {
        const category = this.data.categories[idea.category];
        const status = this.data.statuses[idea.status];
        const author = this.data.users.find(u => u.id === idea.authorId);
        
        // Проверка, голосовал ли текущий пользователь за эту идею
        const hasUpvoted = this.data.currentUser && 
                          idea.upvotedBy.includes(this.data.currentUser.id);
        
        return `
            <div class="idea-card" data-id="${idea.id}">
                <div class="idea-header">
                    <h3 class="idea-title">${idea.title}</h3>
                    <div class="idea-meta">
                        <span class="category ${idea.category}" style="background-color: ${category.color}; color: ${category.textColor}">
                            ${category.name}
                        </span>
                        <span class="date">${this.formatDate(idea.createdAt)}</span>
                    </div>
                </div>
                <div class="idea-body">
                    <p class="idea-description">${idea.description}</p>
                </div>
                <div class="idea-footer">
                    <div class="vote-section">
                        <button class="vote-btn ${hasUpvoted ? 'upvoted' : ''}" data-id="${idea.id}" ${!this.data.currentUser ? 'disabled' : ''}>
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <span class="vote-count">${idea.votes}</span>
                        <button class="vote-btn" disabled>
                            <i class="fas fa-comment"></i>
                        </button>
                        <span>${idea.comments}</span>
                    </div>
                    <span class="status ${idea.status}" style="background-color: ${status.color}; color: ${status.textColor}">
                        ${status.name}
                    </span>
                </div>
            </div>
        `;
    },

    // Настройка кнопок голосования
    setupVoteButtons: function() {
        document.querySelectorAll('.vote-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ideaId = parseInt(btn.getAttribute('data-id'));
                this.voteForIdea(ideaId);
            });
        });
    },

    // Настройка кнопок для открытия деталей идеи
    setupIdeaDetailButtons: function() {
        document.querySelectorAll('.idea-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Не открывать детали, если клик был по кнопке голосования
                if (!e.target.classList.contains('vote-btn')) {
                    const ideaId = parseInt(card.getAttribute('data-id'));
                    this.showIdeaDetail(ideaId);
                }
            });
        });
    },

    // Голосование за идею
    voteForIdea: function(ideaId) {
        if (!this.data.currentUser) {
            this.showModal('login-modal');
            return;
        }

        const idea = this.data.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const userId = this.data.currentUser.id;
        const hasVoted = idea.upvotedBy.includes(userId);

        if (hasVoted) {
            // Убрать голос
            idea.votes--;
            idea.upvotedBy = idea.upvotedBy.filter(id => id !== userId);
        } else {
            // Добавить голос
            idea.votes++;
            idea.upvotedBy.push(userId);
        }

        // Обновить отображение
        this.displayFeaturedIdeas();
        this.displayAllIdeas();
        this.updateStats();
        
        // Показать уведомление
        this.showNotification(
            hasVoted ? 'Ваш голос удален' : 'Спасибо за ваш голос!',
            hasVoted ? 'info' : 'success'
        );
    },

    // Показать детали идеи
    showIdeaDetail: function(ideaId) {
        const idea = this.data.ideas.find(i => i.id === ideaId);
        if (!idea) return;

        const category = this.data.categories[idea.category];
        const status = this.data.statuses[idea.status];
        const author = this.data.users.find(u => u.id === idea.authorId);
        
        // Проверка, голосовал ли текущий пользователь за эту идею
        const hasUpvoted = this.data.currentUser && 
                          idea.upvotedBy.includes(this.data.currentUser.id);

        const detailHtml = `
            <div class="idea-detail">
                <div class="detail-header">
                    <h3>${idea.title}</h3>
                    <div class="detail-meta">
                        <div class="detail-author">
                            <i class="fas fa-user"></i>
                            <span>${author ? author.name : 'Неизвестный автор'}</span>
                        </div>
                        <div class="detail-date">
                            <i class="far fa-calendar"></i>
                            <span>Опубликовано: ${this.formatDate(idea.createdAt)}</span>
                        </div>
                        <span class="category ${idea.category}" style="background-color: ${category.color}; color: ${category.textColor}">
                            ${category.name}
                        </span>
                        <span class="status ${idea.status}" style="background-color: ${status.color}; color: ${status.textColor}">
                            ${status.name}
                        </span>
                    </div>
                </div>
                
                <div class="detail-body">
                    <div class="detail-section">
                        <h4><i class="fas fa-align-left"></i> Описание</h4>
                        <p>${idea.description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-bullseye"></i> Польза для школы</h4>
                        <p>${idea.benefits}</p>
                    </div>
                    
                    <div class="detail-stats">
                        <div class="detail-stat">
                            <span class="number">${idea.votes}</span>
                            <span class="label">Голосов</span>
                        </div>
                        <div class="detail-stat">
                            <span class="number">${idea.comments}</span>
                            <span class="label">Комментариев</span>
                        </div>
                        <div class="detail-stat">
                            <span class="number">${this.getDaysAgo(idea.createdAt)}</span>
                            <span class="label">Дней назад</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-primary vote-btn-detail ${hasUpvoted ? 'upvoted' : ''}" data-id="${idea.id}" ${!this.data.currentUser ? 'disabled' : ''}>
                        <i class="fas fa-thumbs-up"></i> ${hasUpvoted ? 'Убрать голос' : 'Поддержать идею'}
                    </button>
                    <button class="btn-secondary" onclick="CrowdsourcingApp.hideAllModals()">
                        Закрыть
                    </button>
                </div>
            </div>
        `;

        document.getElementById('idea-detail-content').innerHTML = detailHtml;
        
        // Добавить обработчик для кнопки голосования в модальном окне
        const voteBtn = document.querySelector('.vote-btn-detail');
        if (voteBtn) {
            voteBtn.addEventListener('click', () => {
                this.voteForIdea(ideaId);
                this.showIdeaDetail(ideaId); // Обновить детали
            });
        }

        this.showModal('idea-detail-modal');
    },

    // Отправка новой идеи
    submitIdea: function() {
        if (!this.data.currentUser) {
            this.showModal('login-modal');
            return;
        }

        const title = document.getElementById('idea-title').value.trim();
        const category = document.getElementById('idea-category').value;
        const description = document.getElementById('idea-description').value.trim();
        const benefits = document.getElementById('idea-benefits').value.trim();

        if (!title || !category || !description) {
            this.showNotification('Пожалуйста, заполните обязательные поля', 'error');
            return;
        }

        // Создать новую идею
        const newIdea = {
            id: this.data.ideas.length + 1,
            title,
            description,
            benefits,
            category,
            authorId: this.data.currentUser.id,
            votes: 1,
            upvotedBy: [this.data.currentUser.id],
            comments: 0,
            status: "new",
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
        };

        // Добавить идею в данные
        this.data.ideas.unshift(newIdea);

        // Очистить форму
        document.getElementById('idea-form').reset();

        // Показать уведомление
        this.showNotification('Идея успешно опубликована!', 'success');

        // Перейти на страницу идей
        this.navigateTo('ideas');
    },

    // Отправка issue на GitHub
    submitGitHubIssue: function() {
        const title = document.getElementById('issue-title').value.trim();
        const description = document.getElementById('issue-description').value.trim();

        if (!title || !description) {
            this.showNotification('Пожалуйста, заполните все поля', 'error');
            return;
        }

        // В реальном приложении здесь был бы запрос к API GitHub
        // Для демо просто покажем уведомление
        this.showNotification(
            `Issue "${title}" будет создан в репозитории GitHub. В реальном приложении здесь был бы API вызов.`,
            'success'
        );

        // Очистить форму
        document.getElementById('issue-form').reset();
    },

    // Обновление статистики
    updateStats: function() {
        const totalIdeas = this.data.ideas.length;
        const totalVotes = this.data.ideas.reduce((sum, idea) => sum + idea.votes, 0);
        const implemented = this.data.ideas.filter(idea => idea.status === 'implemented').length;

        document.getElementById('total-ideas').textContent = totalIdeas;
        document.getElementById('total-votes').textContent = totalVotes;
        document.getElementById('implemented').textContent = implemented;
    },

    // Настройка графиков
    setupCharts: function() {
        // Инициализация графиков
        this.categoryChart = this.createCategoryChart();
        this.statusChart = this.createStatusChart();
    },

    // Обновление графиков
    updateCharts: function() {
        if (this.categoryChart) this.categoryChart.destroy();
        if (this.statusChart) this.statusChart.destroy();
        
        this.categoryChart = this.createCategoryChart();
        this.statusChart = this.createStatusChart();
    },

    // Создание графика по категориям
    createCategoryChart: function() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Подсчет идей по категориям
        const categories = Object.keys(this.data.categories);
        const counts = categories.map(cat => 
            this.data.ideas.filter(idea => idea.category === cat).length
        );
        
        const colors = categories.map(cat => this.data.categories[cat].color);
        const textColors = categories.map(cat => this.data.categories[cat].textColor);

        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.data.categories[cat].name),
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderColor: textColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    // Создание графика по статусам
    createStatusChart: function() {
        const ctx = document.getElementById('status-chart').getContext('2d');
        
        // Подсчет идей по статусам
        const statuses = Object.keys(this.data.statuses);
        const counts = statuses.map(status => 
            this.data.ideas.filter(idea => idea.status === status).length
        );
        
        const colors = statuses.map(status => this.data.statuses[status].color);
        const textColors = statuses.map(status => this.data.statuses[status].textColor);

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: statuses.map(status => this.data.statuses[status].name),
                datasets: [{
                    label: 'Количество идей',
                    data: counts,
                    backgroundColor: colors,
                    borderColor: textColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    },

    // Отображение топ-5 идей
    displayTopIdeas: function() {
        const container = document.getElementById('top-ideas-list');
        if (!container) return;

        // Отсортировать идеи по количеству голосов
        const sortedIdeas = [...this.data.ideas].sort((a, b) => b.votes - a.votes);
        const topIdeas = sortedIdeas.slice(0, 5);

        container.innerHTML = topIdeas.map((idea, index) => {
            const category = this.data.categories[idea.category];
            return `
                <div class="top-idea-item">
                    <div class="top-idea-rank">${index + 1}</div>
                    <div class="top-idea-content">
                        <h4>${idea.title}</h4>
                        <div class="top-idea-meta">
                            <span class="category-mini ${idea.category}" style="background-color: ${category.color}; color: ${category.textColor}">
                                ${category.name}
                            </span>
                            <span class="votes-count">${idea.votes} голосов</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Отображение ленты активности
    displayActivityFeed: function() {
        const container = document.getElementById('activity-feed');
        if (!container) return;

        // Создаем фиктивную ленту активности на основе идей
        const activities = this.data.ideas
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10)
            .map(idea => {
                const author = this.data.users.find(u => u.id === idea.authorId);
                const category = this.data.categories[idea.category];
                const timeAgo = this.getTimeAgo(idea.updatedAt);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${author ? author.name : 'Ученик'}</strong> ${idea.status === 'new' ? 'предложил(а) новую идею' : 'обновил(а) идею'}: <strong>${idea.title}</strong></p>
                            <div class="activity-meta">
                                <span class="activity-category ${idea.category}" style="background-color: ${category.color}; color: ${category.textColor}">
                                    ${category.name}
                                </span>
                                <span class="activity-time">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

        container.innerHTML = activities.join('');
    },

    // Обновление статистики GitHub
    updateGitHubStats: function() {
        document.getElementById('stars-count').textContent = this.data.githubStats.stars;
        document.getElementById('issues-count').textContent = this.data.githubStats.issues;
    },

    // Форматирование даты
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('ru-RU', options);
    },

    // Получение количества дней назад
    getDaysAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Получение времени назад в читаемом формате
    getTimeAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'сегодня';
        if (diffDays === 1) return 'вчера';
        if (diffDays < 7) return `${diffDays} дня назад`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
        return `${Math.floor(diffDays / 30)} месяца назад`;
    },

    // Показать уведомление
    showNotification: function(message, type = 'info') {
        // Создать элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Добавить стили для уведомления
        if (!document.querySelector('.notification-styles')) {
            const styles = document.createElement('style');
            styles.className = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
                    max-width: 350px;
                }
                .notification-success { background-color: #2ecc71; }
                .notification-error { background-color: #e74c3c; }
                .notification-info { background-color: #3498db; }
                .notification-content {
                    display: flex;
                    align-items: center;
                }
                .notification-content i {
                    margin-right: 10px;
                    font-size: 1.2rem;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Добавить уведомление на страницу
        document.body.appendChild(notification);

        // Удалить уведомление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    CrowdsourcingApp.init();
});
