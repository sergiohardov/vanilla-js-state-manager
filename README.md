# Reactive State System Documentation

Эта библиотека предоставляет реактивную систему управления состоянием, вдохновленную React hooks, но работающую в ванильном JavaScript. Система позволяет создавать реактивные состояния и эффекты как через функциональный API, так и через объектно-ориентированный подход.

## Основные компоненты

### 1. State Class

Базовый класс для создания реактивных состояний. Наследуется от `EventTarget` для обеспечения системы событий.

### 2. useState Function

Функция для создания реактивного состояния, аналогичная React useState.

### 3. useEffect Function

Функция для создания эффектов, которые выполняются при изменении зависимостей.

### 4. AbstractReactiveState Class

Абстрактный класс для создания реактивных компонентов с управлением состоянием.

## Примеры использования

### Базовое использование useState

```javascript
// Создание состояния
const [counter, setCounter] = useState(0);

// Получение значения
console.log(counter.value); // 0

// Обновление значения
setCounter(1);
console.log(counter.value); // 1

// Обновление с функцией
setCounter(prev => prev + 1);
console.log(counter.value); // 2

// Подписка на изменения
const unsubscribe = counter.subscribe((newValue) => {
    console.log('Counter changed to:', newValue);
});

setCounter(10); // Выведет: "Counter changed to: 10"

// Отписка
unsubscribe();
```

### Использование useEffect

```javascript
// Создаем состояния
const [name, setName] = useState('John');
const [age, setAge] = useState(25);

// Эффект, который срабатывает при изменении name
const unsubscribeNameEffect = useEffect(() => {
    console.log('Name changed to:', name.value);
}, [name]);

// Эффект, который срабатывает при изменении age или name
const unsubscribeMultiEffect = useEffect(() => {
    console.log(`Person: ${name.value}, Age: ${age.value}`);
}, [name, age]);

// Эффект без зависимостей (выполняется только один раз)
const unsubscribeOnceEffect = useEffect(() => {
    console.log('This runs only once');
}, []);

// Изменяем состояния
setName('Jane'); // Сработают оба эффекта с name в зависимостях
setAge(30);      // Сработает только мультиэффект

// Очистка эффектов
unsubscribeNameEffect();
unsubscribeMultiEffect();
unsubscribeOnceEffect();
```

### Создание реактивного компонента с AbstractReactiveState

```javascript
class UserProfile extends AbstractReactiveState {
    constructor(initialUser = {}) {
        super();
        
        // Инициализация состояний
        this.useState({
            name: initialUser.name || 'Anonymous',
            email: initialUser.email || '',
            age: initialUser.age || 0,
            isLoading: false
        });
        
        this.setupEffects();
    }
    
    setupEffects() {
        // Эффект для валидации email
        this.useEffect(() => {
            const email = this.state.email;
            const isValid = email.includes('@') && email.includes('.');
            console.log(`Email ${email} is ${isValid ? 'valid' : 'invalid'}`);
        }, [this.State.email]);
        
        // Эффект для логирования изменений пользователя
        this.useEffect(() => {
            console.log('User profile updated:', {
                name: this.state.name,
                email: this.state.email,
                age: this.state.age
            });
        }, [this.State.name, this.State.email, this.State.age]);
        
        // Эффект для проверки возраста
        this.useEffect(() => {
            if (this.state.age >= 18) {
                console.log('User is an adult');
            } else {
                console.log('User is a minor');
            }
        }, [this.State.age]);
    }
    
    // Пользовательские методы
    updateProfile(profileData) {
        this.setIsLoading(true);
        
        // Симуляция асинхронной операции
        setTimeout(() => {
            this.setState(profileData);
            this.setIsLoading(false);
        }, 1000);
    }
    
    incrementAge() {
        this.setAge(prev => prev + 1);
    }
    
    resetProfile() {
        this.setState({
            name: 'Anonymous',
            email: '',
            age: 0,
            isLoading: false
        });
    }
}

// Использование компонента
const userProfile = new UserProfile({
    name: 'Alice',
    email: 'alice@example.com',
    age: 25
});

// Изменение отдельных свойств
userProfile.setName('Bob');
userProfile.setEmail('bob@example.com');
userProfile.incrementAge();

// Обновление нескольких свойств одновременно
userProfile.updateProfile({
    name: 'Charlie',
    email: 'charlie@example.com',
    age: 30
});

// Сброс профиля
userProfile.resetProfile();

// Очистка при уничтожении компонента
userProfile.destroy();
```

### Создание счетчика с UI

```javascript
class Counter extends AbstractReactiveState {
    constructor(initialCount = 0) {
        super();
        
        this.useState({
            count: initialCount,
            step: 1,
            history: []
        });
        
        this.setupEffects();
        this.createUI();
    }
    
    setupEffects() {
        // Эффект для ведения истории изменений
        this.useEffect(() => {
            const newHistory = [...this.state.history, this.state.count];
            if (newHistory.length > 10) {
                newHistory.shift(); // Ограничиваем историю 10 элементами
            }
            this.State.history.update(newHistory);
        }, [this.State.count], false); // false чтобы не выполнять при первом рендере
        
        // Эффект для обновления UI
        this.useEffect(() => {
            this.updateUI();
        }, [this.State.count, this.State.step]);
    }
    
    createUI() {
        this.container = document.createElement('div');
        this.container.innerHTML = `
            <div>
                <h3>Counter</h3>
                <div>Count: <span id="count">0</span></div>
                <div>Step: <span id="step">1</span></div>
                <button id="increment">+</button>
                <button id="decrement">-</button>
                <input type="number" id="stepInput" value="1" min="1">
                <button id="reset">Reset</button>
                <div>History: <span id="history">[]</span></div>
            </div>
        `;
        
        // Привязка событий
        this.container.querySelector('#increment').onclick = () => this.increment();
        this.container.querySelector('#decrement').onclick = () => this.decrement();
        this.container.querySelector('#reset').onclick = () => this.reset();
        this.container.querySelector('#stepInput').oninput = (e) => {
            this.setStep(parseInt(e.target.value) || 1);
        };
        
        document.body.appendChild(this.container);
        this.updateUI();
    }
    
    updateUI() {
        if (this.container) {
            this.container.querySelector('#count').textContent = this.state.count;
            this.container.querySelector('#step').textContent = this.state.step;
            this.container.querySelector('#history').textContent = 
                JSON.stringify(this.state.history);
        }
    }
    
    increment() {
        this.setCount(prev => prev + this.state.step);
    }
    
    decrement() {
        this.setCount(prev => prev - this.state.step);
    }
    
    reset() {
        this.setState({
            count: 0,
            history: []
        });
    }
    
    destroy() {
        super.destroy();
        if (this.container) {
            this.container.remove();
        }
    }
}

// Использование
const counter = new Counter(5);
```

### Асинхронные операции

```javascript
class DataLoader extends AbstractReactiveState {
    constructor() {
        super();
        
        this.useState({
            data: null,
            loading: false,
            error: null
        });
        
        this.setupEffects();
    }
    
    setupEffects() {
        // Эффект для отслеживания состояния загрузки
        this.useEffect(() => {
            if (this.state.loading) {
                console.log('Loading started...');
            } else {
                console.log('Loading finished');
            }
        }, [this.State.loading]);
        
        // Эффект для обработки ошибок
        this.useEffect(() => {
            if (this.state.error) {
                console.error('Error occurred:', this.state.error);
            }
        }, [this.State.error]);
        
        // Эффект для обработки успешной загрузки данных
        this.useEffect(() => {
            if (this.state.data && !this.state.loading) {
                console.log('Data loaded successfully:', this.state.data);
            }
        }, [this.State.data, this.State.loading]);
    }
    
    async loadData(url) {
        this.setState({
            loading: true,
            error: null
        });
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            this.setState({
                data,
                loading: false
            });
        } catch (error) {
            this.setState({
                loading: false,
                error: error.message
            });
        }
    }
    
    clearData() {
        this.setState({
            data: null,
            error: null
        });
    }
}

// Использование
const dataLoader = new DataLoader();
dataLoader.loadData('https://jsonplaceholder.typicode.com/posts/1');
```

## API Reference

### State Class

#### Constructor
- `new State(initialValue)` - создает новое состояние с начальным значением

#### Properties
- `value` - getter для получения текущего значения состояния

#### Methods
- `update(newValue)` - обновляет значение состояния и уведомляет подписчиков
- `subscribe(callback, options)` - подписывается на изменения состояния, возвращает функцию отписки

### useState Function

#### Syntax
```javascript
const [state, setter] = useState(initialValue);
```

#### Parameters
- `initialValue` - начальное значение состояния

#### Returns
- `[State, Function]` - массив из объекта состояния и функции для его обновления

### useEffect Function

#### Syntax
```javascript
const unsubscribe = useEffect(callback, dependencies, firstRenderCall);
```

#### Parameters
- `callback` - функция, которая будет выполняться при изменении зависимостей
- `dependencies` - массив объектов State, при изменении которых выполняется callback
- `firstRenderCall` - boolean, выполнять ли callback при первом вызове (по умолчанию true)

#### Returns
- `Function` - функция для отписки от всех зависимостей

### AbstractReactiveState Class

#### Methods
- `useState(initialObj)` - инициализирует состояния из объекта
- `useEffect(cb, deps, firstRenderCall)` - создает эффект
- `setState(updater)` - обновляет несколько состояний одновременно
- `destroy()` - очищает все эффекты

#### Автоматически генерируемые методы
Для каждого ключа в `useState` автоматически создается setter вида `set{CapitalizedKey}`.

## Особенности

1. **Реактивность** - все изменения состояния автоматически уведомляют подписчиков
2. **Функциональные обновления** - поддержка функций-updater'ов как в React
3. **Автоматическая очистка** - `destroy()` метод автоматически отписывается от всех эффектов
4. **Типобезопасность** - приватные поля для защиты внутреннего состояния
5. **Гибкость** - можно использовать как функциональный API, так и классовый подход

## Рекомендации по использованию

1. Всегда вызывайте `destroy()` при уничтожении компонента для предотвращения утечек памяти
2. Избегайте создания циклических зависимостей в эффектах
3. Используйте функциональные обновления для состояний, которые зависят от предыдущего значения
4. Группируйте связанные состояния в одном объекте при использовании `useState` в классе
