import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600">
            © 2024 Replai. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <Link 
              href="/privacy-policy.html" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-of-service.html" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/cookie-policy.html" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cookie Policy
            </Link>
            <a 
              href="mailto:marco@midachat.com" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 