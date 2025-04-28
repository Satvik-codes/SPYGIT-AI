import { Link } from 'react-router-dom';
import { Github, Search, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-14 items-center px-4 max-w-[1420px] mx-auto">
        <Link to="/" className="flex items-center space-x-2">
          <Github className="h-5 w-5" />
          <span className="font-bold">SPYGIT</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-2">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </Link>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}