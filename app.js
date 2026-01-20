// Школьный краудсорсинг - основное приложение
class CrowdsourcingApp {
    constructor() {
        this.ideas = [];
        this.currentFilter = 'all';
        this.votedIdeas = JSON.parse(localStorage.getItem('votedIdeas')) || [];
        this.init();
    }

    // Инициализация приложения
    init() {
        this.loadIdeas();
        this.setupEventListeners();
        this.updateStats();
        this.setupCharacterCounters();
        this.loadLeaderboard();
        
        // Проверка темы
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    // Загрузка идей (в реальном приложении здесь был бы запрос к серверу)
    loadIdeas() {
        // Имитация задержки загрузки
        setTimeout(() => {
            // Проверяем, есть ли идеи в localStorage
            const savedIdeas = localStorage.getItem('schoolIdeas');
            
            if (savedIdeas) {
                this.ideas = JSON.parse(savedIdeas);
            } else {
                // Начальные данные для демонстрации
                this.ideas = [
                    {
                        id: 1,
                        title: "Установка кулеров с водой на каждом этаже",
                        description: "Предлагаю установить кулеры с питьевой водой на каждом этаже школы, чтобы ученики могли пить воду в течение дня. Это поможет поддерживать водный баланс и улучшит самочувствие.",
                        category: "infrastructure",
                        author: "Анна С.",
                        class: "10А",
                        votes: 24,
                        date: "2023-09-15",
                        status: "popular",
                        implemented: false
                    },
                    {
                        id: 2,
                        title: "Организация школьного книгообмена",
                        description: "Создать полку в библиотеке, где ученики могут оставлять прочитанные книги и брать другие бесплатно. Это разовьет культуру чтения и сэкономит средства семей.",
                        category: "education",
                        author: "Максим К.",
                        class: "9Б",
                        votes: 18,
                        date: "2023-10-02",
                        status: "new",
                        implemented: false
                    },
                    {
                        id: 3,
                        title: "День самоуправления 2 раза в год",
                        description: "Проводить День самоуправления не один, а два раза в год (осенью и весной). Это даст возможность большему количеству учеников попробовать себя в роли учителей и администрации.",
                        category: "events",
                        author: "Диана М.",
                        class: "11А",
                        votes: 32,
                        date: "2023-08-28",
                        status: "implemented",
                        implemented: true
                    },
                    {
                        id: 4,
                        title: "Создание зоны отдыха в школьном дворе",
                        description: "Установить скамейки, столики и навесы в школьном дворе для отдыха учеников между уроками и после занятий.",
                        category: "infrastructure",
                        author: "Илья П.",
                        class: "8В",
                        votes: 15,
                        date: "2023-10-10",
                        status: "new",
                        implemented: false
                    },
                    {
                        id: 5,
                        title: "Фестиваль культур народов мира",
                        description: "Организовать ежегодный фестиваль, где каждый класс представляет культуру одной страны: национальные блюда, танцы, традиции.",
                        category: "events",
                        author: "София Л.",
                        class: "10Б",
                        votes: 21,
                        date: "2023-09-22",
                        status: "popular",
                        implemented: false
                    },
                    {
                        id: 6,
                        title: "Введение курса финансовой грамотности",
                        description: "Добавить в учебный план курс по финансовой грамотности для старших классов, чтобы научить планировать бюджет, разбираться в налогах и инвестициях.",
                        category: "education",
                        author: "Аноним",
                        class: "",
                        votes: 28,
                        date: "2023-09-05",
                        status: "popular",
                        implemented: false
                    }
                ];
                this.saveIdeas();
            }
            
            this.renderIdeas();
        }, 800);
    }

    // Сохранение идей в localStorage
    saveIdeas() {
        localStorage.setItem('schoolIdeas', JSON.stringify(this.ideas));
    }

    // Сохранение голосов в localStorage
    saveVotes() {
        localStorage.setItem('votedIdeas', JSON.stringify(this.votedIdeas));
    }

    // Рендеринг идей на странице
    renderIdeas() {
        const container = document.getElementById('ideas-container');
        
        // Фильтрация идей
        let filteredIdeas = [...this.ideas];
        
        if (this.currentFilter === 'new') {
            filteredIdeas = filteredIdeas.filter(idea => idea.status === 'new');
        } else if (this.currentFilter === 'popular') {
            filteredIdeas = filteredIdeas.filter(idea => idea.status === 'popular');
        } else if (this.currentFilter === 'implemented') {
            filteredIdeas = filteredIdeas.filter(idea => idea.implemented);
        }
        
        // Сортировка по количеству голосов (по убыванию)
        filteredIdeas.sort((a, b) => b.votes - a.votes);
        
        if (filteredIdeas.length === 0) {
            container.innerHTML = `
                <div class="no-ideas">
                    <i class="fas fa-lightbulb"></i>
                    <h3>Идей пока нет</h3>
                    <p>Будьте первым, кто предложит идею для улучшения школы!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredIdeas.map(idea => this.createIdeaCard(idea)).join('');
        
        // Добавляем обработчики событий для кнопок голосования
        document.querySelectorAll('.vote-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const ideaId = parseInt(button.dataset.id);
                this.voteForIdea(ideaId);
            });
        });
        
        // Добавляем обработчики для открытия модального окна
        document.querySelectorAll('.idea-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.vote-btn')) {
                    const ideaId = parseInt(card.dataset.id);
                    this.openIdeaModal(ideaId);
                }
            });
        });
    }

    // Создание карточки идеи
    createIdeaCard(idea) {
        const categoryNames = {
            infrastructure: 'Инфраструктура',
            education: 'Учебный процесс',
            events: 'Мероприятия',
            sport: 'Спорт и здоровье',
            other: 'Другое'
        };
        
        const isVoted = this.votedIdeas.includes(idea.id);
        const voteBtnClass = isVoted ? 'vote-btn voted' : 'vote-btn';
        const voteBtnText = isVoted ? 'Голос отдан' : 'Голосовать';
        
        let statusBadge = '';
        if (idea.implemented) {
            statusBadge = '<div class="idea-status status-implemented"><i class="fas fa-check-circle"></i> Реализовано</div>';
        } else if (idea.status === 'popular') {
            statusBadge = '<div class="idea-status status-popular"><i class="fas fa-fire"></i> Популярная</div>';
        } else if (idea.status === 'new') {
            statusBadge = '<div class="idea-status status-new"><i class="fas fa-star"></i> Новая</div>';
        }
        
        return `
            <div class="idea-card" data-id="${idea.id}">
                <div class="idea-header">
                    <div>
                        <h3 class="idea-title">${idea.title}</h3>
                        <span class="idea-category">${categoryNames[idea.category] || idea.category}</span>
                    </div>
                </div>
                <p class="idea-description">${idea.description}</p>
                ${statusBadge}
                <div class="idea-footer">
                    <div class="idea-author">
                        <i class="fas fa-user"></i>
                        <span>${idea.author || 'Аноним'} ${idea.class ? `, ${idea.class}` : ''}</span>
                    </div>
                    <div class="idea-votes">
                        <button class="${voteBtnClass}" data-id="${idea.id}">
                            <i class="fas fa-thumbs-up"></i> ${voteBtnText}
                        </button>
                        <span class="vote-count">${idea.votes}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Голосование за идею
    voteForIdea(ideaId) {
        // Проверяем, голосовал ли уже пользователь
        if (this.votedIdeas.includes(ideaId)) {
            this.showNotification('Вы уже голосовали за эту идею!', 'warning');
            return;
        }
        
        // Проверяем лимит голосов (максимум 3 идеи)
        if (this.votedIdeas.length >= 3) {
            this.showNotification('Вы можете проголосовать только за 3 идеи!', 'warning');
            return;
        }
        
        // Находим идею и увеличиваем счетчик голосов
        const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
        if (ideaIndex !== -1) {
            this.ideas[ideaIndex].votes++;
            
            // Обновляем статус идеи на "популярная", если она набрала 15+ голосов
            if (this.ideas[ideaIndex].votes >= 15 && !this.ideas[ideaIndex].implemented) {
                this.ideas[ideaIndex].status = 'popular';
            }
            
            // Добавляем идею в список проголосованных
            this.votedIdeas.push(ideaId);
            
            // Сохраняем изменения
            this.saveIdeas();
            this.saveVotes();
            
            // Обновляем интерфейс
            this.renderIdeas();
            this.updateStats();
            this.loadLeaderboard();
            
            // Показываем уведомление
            this.showNotification('Ваш голос учтен!', 'success');
        }
    }

    // Открытие модального окна с деталями идеи
    openIdeaModal(ideaId) {
        const idea = this.ideas.find(idea => idea.id === ideaId);
        if (!idea) return;
        
        const categoryNames = {
            infrastructure: 'Инфраструктура',
            education: 'Учебный процесс',
            events: 'Мероприятия',
            sport: 'Спорт и здоровье',
            other: 'Другое'
        };
        
        const statusText = idea.implemented ? 
            '<span class="status-implemented"><i class="fas fa-check-circle"></i> Реализовано</span>' : 
            (idea.status === 'popular' ? 
                '<span class="status-popular"><i class="fas fa-fire"></i> Популярная идея</span>' : 
                '<span class="status-new"><i class="fas fa-star"></i> Новая идея</span>');
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="modal-idea">
                <h2>${idea.title}</h2>
                <div class="modal-meta">
                    <span><i class="fas fa-tag"></i> ${categoryNames[idea.category] || idea.category}</span>
                    <span><i class="fas fa-user"></i> ${idea.author || 'Аноним'} ${idea.class ? `, ${idea.class}` : ''}</span>
                    <span><i class="fas fa-calendar"></i> ${idea.date}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${idea.votes} голосов</span>
                </div>
                <div class="modal-status">${statusText}</div>
                <div class="modal-description">
                    <h3><i class="fas fa-align-left"></i> Описание идеи</h3>
                    <p>${idea.description}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary vote-btn-modal" data-id="${idea.id}">
                        <i class="fas fa-thumbs-up"></i> 
                        ${this.votedIdeas.includes(idea.id) ? 'Голос отдан' : 'Поддержать идею'}
                    </button>
                    <button class="btn-secondary modal-close-btn">Закрыть</button>
                </div>
            </div>
        `;
        
        // Открываем модальное окно
        const modal = document.getElementById('idea-modal');
        modal.classList.add('active');
        
        // Добавляем обработчики событий
        document.querySelector('.vote-btn-modal').addEventListener('click', () => {
            this.voteForIdea(ideaId);
            modal.classList.remove('active');
        });
        
        document.querySelector('.modal-close-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Закрытие по кнопке закрытия
        document.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Добавление новой идеи
    addNewIdea(ideaData) {
        // Генерируем ID для новой идеи
        const newId = this.ideas.length > 0 ? Math.max(...this.ideas.map(idea => idea.id)) + 1 : 1;
        
        // Определяем статус новой идеи
        let status = 'new';
        if (ideaData.votes >= 15) {
            status = 'popular';
        }
        
        // Создаем новую идею
        const newIdea = {
            id: newId,
            title: ideaData.title,
            description: ideaData.description,
            category: ideaData.category,
            author: ideaData.author || 'Аноним',
            class: ideaData.class || '',
            votes: 0,
            date: new Date().toISOString().split('T')[0],
            status: status,
            implemented: false
        };
        
        // Добавляем идею в массив
        this.ideas.push(newIdea);
        
        // Сохраняем изменения
        this.saveIdeas();
        
        // Обновляем интерфейс
        this.renderIdeas();
        this.updateStats();
        this.loadLeaderboard();
        
        // Показываем уведомление
        this.showNotification('Идея успешно добавлена!', 'success');
        
        // Очищаем форму
        this.clearForm();
    }

    // Очистка формы
    clearForm() {
        document.getElementById('idea-title').value = '';
        document.getElementById('idea-description').value = '';
        document.getElementById('idea-author').value = '';
        document.getElementById('idea-class').value = '';
        document.getElementById('idea-category').selectedIndex = 0;
        
        // Сбрасываем счетчики символов
        document.getElementById('title-chars').textContent = '0';
        document.getElementById('desc-chars').textContent = '0';
    }

    // Обновление статистики
    updateStats() {
        const totalIdeas = this.ideas.length;
        const totalVotes = this.ideas.reduce((sum, idea) => sum + idea.votes, 0);
        const implementedIdeas = this.ideas.filter(idea => idea.implemented).length;
        
        document.getElementById('total-ideas').textContent = totalIdeas;
        document.getElementById('total-votes').textContent = totalVotes;
        document.getElementById('implemented-ideas').textContent = implementedIdeas;
    }

    // Загрузка рейтинга участников
    loadLeaderboard() {
        // Создаем объект для подсчета активности участников
        const userStats = {};
        
        this.ideas.forEach(idea => {
            if (idea.author && idea.author !== 'Аноним') {
                const userKey = `${idea.author}_${idea.class}`;
                
                if (!userStats[userKey]) {
                    userStats[userKey] = {
                        name: idea.author,
                        class: idea.class,
                        ideas: 0,
                        votes: 0,
                        points: 0
                    };
                }
                
                userStats[userKey].ideas += 1;
                userStats[userKey].votes += idea.votes;
                userStats[userKey].points += idea.votes + 5; // 5 очков за каждую идею + голоса
            }
        });
        
        // Преобразуем в массив и сортируем по очкам
        const leaderboardData = Object.values(userStats)
            .sort((a, b) => b.points - a.points)
            .slice(0, 10); // Топ-10 участников
        
        const tbody = document.getElementById('leaderboard-body');
        
        if (leaderboardData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 2rem; color: var(--gray-color); margin-bottom: 15px; display: block;"></i>
                        <p>Пока нет активных участников</p>
                        <p>Предложите первую идею!</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = leaderboardData.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>${user.class || '-'}</td>
                <td>${user.ideas}</td>
                <td>${user.votes}</td>
                <td>${user.points}</td>
            </tr>
        `).join('');
    }

    // Настройка счетчиков символов
    setupCharacterCounters() {
        const titleInput = document.getElementById('idea-title');
        const descInput = document.getElementById('idea-description');
        const titleChars = document.getElementById('title-chars');
        const descChars = document.getElementById('desc-chars');
        
        titleInput.addEventListener('input', () => {
            titleChars.textContent = titleInput.value.length;
        });
        
        descInput.addEventListener('input', () => {
            descChars.textContent = descInput.value.length;
        });
    }

    // Показать уведомление
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const icon = notification.querySelector('i');
        
        // Устанавливаем текст и иконку в зависимости от типа
        notificationText.textContent = message;
        
        if (type === 'success') {
            icon.className = 'fas fa-check-circle';
            notification.style.backgroundColor = 'var(--primary-color)';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
            notification.style.backgroundColor = 'var(--warning-color)';
        }
        
        // Показываем уведомление
        notification.classList.add('active');
        
        // Скрываем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Переключение темы
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            const icon = document.querySelector('#theme-toggle i');
            if (document.body.classList.contains('dark-theme')) {
                icon.className = 'fas fa-sun';
                localStorage.setItem('theme', 'dark');
            } else {
                icon.className = 'fas fa-moon';
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Фильтрация идей
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Убираем активный класс у всех кнопок
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Добавляем активный класс текущей кнопке
                button.classList.add('active');
                
                // Устанавливаем текущий фильтр
                this.currentFilter = button.dataset.filter;
                
                // Рендерим идеи с учетом фильтра
                this.renderIdeas();
            });
        });
        
        // Отправка формы
        document.getElementById('submit-idea').addEventListener('click', () => {
            this.submitIdea();
        });
        
        // Закрытие модального окна
        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('idea-modal').classList.remove('active');
        });
        
        // Отправка формы по нажатию Enter
        document.getElementById('idea-title').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitIdea();
            }
        });
    }

    // Обработка отправки формы
    submitIdea() {
        const title = document.getElementById('idea-title').value.trim();
        const description = document.getElementById('idea-description').value.trim();
        const category = document.getElementById('idea-category').value;
        const author = document.getElementById('idea-author').value.trim();
        const userClass = document.getElementById('idea-class').value.trim();
        
        // Валидация
        if (!title) {
            this.showNotification('Введите название идеи!', 'warning');
            document.getElementById('idea-title').focus();
            return;
        }
        
        if (title.length < 5) {
            this.showNotification('Название идеи должно содержать минимум 5 символов!', 'warning');
            document.getElementById('idea-title').focus();
            return;
        }
        
        if (!description) {
            this.showNotification('Введите описание идеи!', 'warning');
            document.getElementById('idea-description').focus();
            return;
        }
        
        if (description.length < 20) {
            this.showNotification('Описание идеи должно содержать минимум 20 символов!', 'warning');
            document.getElementById('idea-description').focus();
            return;
        }
        
        // Создаем объект с данными идеи
        const ideaData = {
            title,
            description,
            category,
            author: author || null,
            class: userClass || null,
            votes: 0
        };
        
        // Добавляем новую идею
        this.addNewIdea(ideaData);
        
        // Прокручиваем к секции с идеями
        document.getElementById('ideas').scrollIntoView({ behavior: 'smooth' });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CrowdsourcingApp();
});
