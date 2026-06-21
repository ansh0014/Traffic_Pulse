
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, Brain, ShieldAlert, Map as MapIcon, ArrowRight, ChevronRight, Zap } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">GridLock</span>
        </div>
        <div className="flex gap-6 items-center">
          <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#technology" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Technology</a>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 rounded-full backdrop-blur-md transition-all flex items-center gap-2"
          >
            Open App
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-4 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-medium text-indigo-200">GridLock 2.0 Engine Live</span>
        </motion.div>

        <motion.h1 
          className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Urban Mobility,<br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
            Powered by AI.
          </span>
        </motion.h1>

        <motion.p 
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Harness the power of advanced deep learning to predict traffic anomalies, 
          optimize routes, and transform city infrastructure in real-time.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button 
            onClick={() => navigate('/dashboard')}
            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Launch Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
          
          <button 
            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 text-indigo-400" />
            View Architecture
          </button>
        </motion.div>
      </main>

      {/* Features Showcase */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Neural Infrastructure</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">GridLock's core utilizes spatio-temporal graph convolutional networks to understand traffic flow patterns at a city-wide scale.</p>
        </div>

        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={fadeIn}
              className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.color} shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Visual Tech Section */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto overflow-hidden">
        <div className="relative rounded-[2.5rem] bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] p-1 md:p-4">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay rounded-[2.5rem]"></div>
          <div className="relative rounded-[2rem] bg-[#0A0A0A] overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-16 gap-12">
            
            <div className="w-full md:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-6 uppercase tracking-wider">
                <Brain className="w-3 h-3" /> Machine Learning Core
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Predictive capabilities that learn & adapt.</h2>
              <p className="text-gray-400 mb-8 text-lg">
                By ingesting thousands of data points per second, our AI models forecast congestion probabilities up to 45 minutes in advance with 94% accuracy.
              </p>
              
              <ul className="space-y-4">
                {['Real-time anomaly detection', 'Spatio-temporal flow prediction', 'Dynamic signal optimization'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                      <ChevronRight className="w-3 h-3 text-indigo-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[400px] flex items-center justify-center">
              {/* Abstract visualization of a neural network/grid */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[120%] h-[120%] bg-indigo-500/10 rounded-full blur-3xl absolute"></div>
                <div className="relative w-full aspect-square max-w-[400px] grid grid-cols-5 gap-2 md:gap-4 p-4">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.1, scale: 0.8 }}
                      animate={{ 
                        opacity: [0.1, 0.8, 0.1],
                        scale: [0.8, 1, 0.8],
                        backgroundColor: i % 7 === 0 ? '#8b5cf6' : i % 3 === 0 ? '#4f46e5' : '#374151'
                      }}
                      transition={{
                        duration: 3 + (i % 2),
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                    />
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-8 text-center mt-20">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-indigo-500" />
          <span className="font-bold text-lg">GridLock</span>
        </div>
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} GridLock Intelligence. Empowering smarter cities.</p>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Predictive Routing",
    description: "Our transformer models analyze historical and live data streams to reroute traffic preemptively, preventing gridlocks before they form.",
    icon: MapIcon,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Anomaly Detection",
    description: "Instant identification of accidents, roadworks, and unusual behavior using computer vision and edge-deployed ML models.",
    icon: ShieldAlert,
    color: "from-rose-500 to-orange-500"
  },
  {
    title: "Deep Analytics",
    description: "Generate actionable insights for urban planners with our comprehensive dashboard powered by high-dimensional data clustering.",
    icon: Brain,
    color: "from-purple-500 to-indigo-500"
  }
];
