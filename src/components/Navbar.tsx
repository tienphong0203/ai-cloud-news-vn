import { Search, Bell, User, Menu, Sun, Moon } from "lucide-react";

interface NavbarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onToggleNotifications: () => void;
  notificationCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function Navbar({ 
  selectedCategory, 
  onSelectCategory, 
  onToggleNotifications,
  notificationCount,
  isDarkMode,
  onToggleTheme
}: NavbarProps) {
  const categories = ["Tất cả", "Vietnam", "China", "USA", "Europe"];

  return (
    <nav className="border-b border-gn-borderColor bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectCategory("Tất cả")}>
            <div className="w-8 h-8 bg-gn-green rounded flex items-center justify-center">
              <span className="text-black font-black text-xl">G</span>
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase hidden sm:block">
              GreenNode <span className="text-gn-green">Radar</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gn-textMuted">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`transition-colors hover:text-gn-green ${selectedCategory === cat ? "text-gn-green" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleTheme}
            className="p-2 text-gn-textMuted hover:text-foreground transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="hidden sm:flex items-center bg-gn-darkGray border border-gn-borderColor rounded-full px-3 py-1.5 gap-2">
            <Search size={16} className="text-gn-textMuted" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="bg-transparent border-none outline-none text-xs w-24 focus:w-40 transition-all"
            />
          </div>
          
          <button 
            onClick={onToggleNotifications}
            className="p-2 text-gn-textMuted hover:text-foreground transition-colors relative"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
            )}
          </button>
          
          <button className="p-2 text-gn-textMuted hover:text-foreground transition-colors md:hidden">
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gn-borderColor">
            <div className="w-8 h-8 rounded-full bg-gn-borderColor flex items-center justify-center">
              <User size={16} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
