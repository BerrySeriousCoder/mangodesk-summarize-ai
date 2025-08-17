import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MangoDesk - AI Meeting Notes Summarizer',
  description: 'Upload meeting transcripts and get AI-powered summaries with custom instructions. Share summaries via email with version history.',
  keywords: 'AI, meeting notes, summarizer, transcript, email sharing',
  authors: [{ name: 'MangoDesk Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-dark-950">
          <header className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-white">
                      🥭 MangoDesk
                    </h1>
                  </div>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="nav-link">
                    Home
                  </a>
                  <a 
                    href="https://www.harshvsingh.site/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="nav-link"
                  >
                    Contact
                  </a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="bg-dark-900/80 backdrop-blur-xl border-t border-dark-700/50 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-dark-400">
                <p>&copy; 2024 MangoDesk. Powered by AI technology.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
