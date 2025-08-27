import './globals.css'
import '../public/css/base.css'
import '../public/css/portfolio.css'
import '../public/css/navigation.css'
import '../public/css/footer.css'
import '../public/css/responsive.css'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { ToastProvider } from './components/Toast'
import AINeuralBackground from './components/AINeuralBackground'

export const metadata={title:'Cochran Films',description:'Next migration'}
export default function RootLayout({children}){
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=Poppins:wght@500;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <AINeuralBackground />
          <Nav />
          <div className="wrapper">
            {children}
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}