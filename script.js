// Инициализация Supabase
const SUPABASE_URL = 'https://dnohkazomuimexysmale.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hCsHAo_Kio3X7omf3z1ydA_yWpgeJsT';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Обновленный объект приложения
const CrowdsourcingApp = {
    data: {
        currentUser: null,
        ideas: [],
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

    // Инициализация
    init: async function() {
        await this.checkAuth();
        this.setupEventListeners();
        this.setupNavigation();
        await this.loadIdeas();
        this.updateStats();
        this.displayFeaturedIdeas();
    },

    // Проверка авторизации
    checkAuth: async function() {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Получаем данные пользователя из нашей таблицы
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            
            this.data.currentUser = {
                id: user.id,
                email: user.email,
                ...userData
            };
            
            this.updateUserUI();
        }
    },

    // Обновление UI пользователя
    updateUserUI: function() {
        if (this.data.currentUser) {
            document.getElementById('username').textContent = this.data.currentUser.name;
            document.getElementById('login-btn').textContent = 'Выйти';
            document.getElementById('login-btn').onclick = () => this.logout();
        } else {
            document.getElementById('username').textContent = 'Гость';
            document.getElementById('login-btn').textContent = 'Войти';
            document.getElementById('login-btn').onclick = () => this.showModal('auth-modal');
        }
    },

    // Загрузка идей из базы
    loadIdeas: async function() {
        try {
            const { data, error } = await supabase
                .from('ideas')
                .select(`
                    *,
                    author:users(name, role),
                    votes(count),
                    comments(count)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Преобразуем данные
            this.data.ideas = data.map(idea => ({
                ...idea,
                votes: idea.votes[0]?.count || 0,
                comments_count: idea.comments[0]?.count || 0
            }));
            
        } catch (error) {
            console.error('Ошибка загрузки идей:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        }
    },

    // Регистрация
    register: async function(email, password, name, role) {
        try {
            // Регистрация в Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name }
                }
            });
            
            if (authError) throw authError;
            
            // Создание пользователя в нашей таблице
            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        name: name,
                        role: role
                    }
                ]);
            
            if (dbError) throw dbError;
            
            this.data.currentUser = {
                id: authData.user.id,
                email: email,
                name: name,
                role: role
            };
            
            this.updateUserUI();
            this.hideAllModals();
            this.showNotification('Регистрация успешна!', 'success');
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    },

    // Вход
    login: async function(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Получаем данные пользователя
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            
            this.data.currentUser = {
                id: data.user.id,
                email: data.user.email,
                ...userData
            };
            
            this.updateUserUI();
            this.hideAllModals();
            this.showNotification('Вход выполнен!', 'success');
            
        } catch (error) {
            this.showNotification('Ошибка входа: ' + error.message, 'error');
        }
    },

    // Выход
    logout: async function() {
        await supabase.auth.signOut();
        this.data.currentUser = null;
        this.updateUserUI();
        this.showNotification('Вы вышли из системы', 'info');
    },

    // Добавление идеи
    submitIdea: async function(title, category, description, benefits) {
        if (!this.data.currentUser) {
            this.showModal('auth-modal');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('ideas')
                .insert([
                    {
                        title,
                        description,
                        benefits,
                        category,
                        author_id: this.data.currentUser.id,
                        status: 'new'
                    }
                ])
                .select()
                .single();
            
            if (error) throw error;
            
            // Автоматически голосуем за свою идею
            await this.voteForIdea(data.id);
            
            this.showNotification('Идея успешно опубликована!', 'success');
            
            // Перезагружаем идеи
            await this.loadIdeas();
            this.displayFeaturedIdeas();
            this.displayAllIdeas();
            this.updateStats();
            
            // Переходим на страницу идей
            this.navigateTo('ideas');
            
        } catch (error) {
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    },

    // Голосование за идею
    voteForIdea: async function(ideaId) {
        if (!this.data.currentUser) {
            this.showModal('auth-modal');
            return;
        }
        
        try {
            // Проверяем, голосовал ли уже пользователь
            const { data: existingVote } = await supabase
                .from('votes')
                .select('id')
                .eq('idea_id', ideaId)
                .eq('user_id', this.data.currentUser.id)
                .single();
            
            if (existingVote) {
                // Удаляем голос
                await supabase
                    .from('votes')
                    .delete()
                    .eq('id', existingVote.id);
                
                this.showNotification('Ваш голос удален', 'info');
            } else {
                // Добавляем голос
                await supabase
                    .from('votes')
                    .insert([
                        {
                            idea_id: ideaId,
                            user_id: this.data.currentUser.id
                        }
                    ]);
                
                this.showNotification('Спасибо за ваш голос!', 'success');
            }
            
            // Обновляем идеи
            await this.loadIdeas();
            this.displayFeaturedIdeas();
            this.displayAllIdeas();
            this.updateStats();
            
        } catch (error) {
            console.error('Ошибка голосования:', error);
        }
    },

    // Добавление комментария
    addComment: async function(ideaId, content) {
        if (!this.data.currentUser) {
            this.showModal('auth-modal');
            return;
        }
        
        try {
            await supabase
                .from('comments')
                .insert([
                    {
                        idea_id: ideaId,
                        user_id: this.data.currentUser.id,
                        content: content
                    }
                ]);
            
            // Обновляем счетчик комментариев
            await supabase.rpc('increment_comments', { idea_id: ideaId });
            
            this.showNotification('Комментарий добавлен', 'success');
            
        } catch (error) {
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    },

    // Загрузка комментариев
    loadComments: async function(ideaId) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users(name, role)
                `)
                .eq('idea_id', ideaId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
            return [];
        }
    },

    // Реализация реального времени
    setupRealtime: function() {
        // Подписка на новые идеи
        supabase
            .channel('ideas-channel')
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'ideas' },
                async (payload) => {
                    console.log('Новая идея!', payload.new);
                    await this.loadIdeas();
                    this.displayFeaturedIdeas();
                    this.displayAllIdeas();
                    this.updateStats();
                    this.showNotification('Добавлена новая идея!', 'info');
                }
            )
            .subscribe();
        
        // Подписка на обновления голосов
        supabase
            .channel('votes-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'votes' },
                async () => {
                    await this.loadIdeas();
                    this.displayFeaturedIdeas();
                    this.displayAllIdeas();
                    this.updateStats();
                }
            )
            .subscribe();
    }
};

// Обновляем обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    CrowdsourcingApp.init();
});
