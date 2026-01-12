import React from 'react';
import { AnimationProvider } from '../lib/animation';
import { SmoothScrollProvider, useSmoothScroll } from './SmoothScrollProvider';
import { Button } from './ui/button';

// Demo component to show SmoothScrollProvider usage
function ScrollContent() {
  const { scrollTo, isEnabled } = useSmoothScroll();

  return (
    <div className="space-y-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Smooth Scroll Demo</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Smooth scrolling is {isEnabled ? 'enabled' : 'disabled'}
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button 
            onClick={() => scrollTo('#section1')}
            variant="outline"
          >
            Go to Section 1
          </Button>
          <Button 
            onClick={() => scrollTo('#section2')}
            variant="outline"
          >
            Go to Section 2
          </Button>
          <Button 
            onClick={() => scrollTo('#section3')}
            variant="outline"
          >
            Go to Section 3
          </Button>
          <Button 
            onClick={() => scrollTo(0)}
            variant="outline"
          >
            Back to Top
          </Button>
        </div>
      </div>

      {/* Content sections */}
      <div id="section1" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Section 1</h2>
        <p className="text-lg leading-relaxed">
          This is the first section. The smooth scrolling should provide a fluid experience
          when navigating between sections. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Card {i + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Some content for card {i + 1}. This helps demonstrate the smooth scrolling behavior.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div id="section2" className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Section 2</h2>
        <p className="text-lg leading-relaxed">
          This is the second section. Notice how the scrolling feels smooth and natural.
          The Lenis library provides momentum-based scrolling that feels great on all devices.
        </p>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Feature {i + 1}</h3>
              <p className="text-muted-foreground">
                Description of feature {i + 1}. The smooth scrolling enhances the user experience
                by providing fluid navigation between different sections of content.
              </p>
            </div>
          ))}
        </div>
      </div>

      <div id="section3" className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Section 3</h2>
        <p className="text-lg leading-relaxed">
          This is the third and final section. The smooth scrolling works consistently
          across all sections and respects user preferences for reduced motion.
        </p>
        <div className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-3"></div>
                <h3 className="font-semibold mb-2">Item {i + 1}</h3>
                <p className="text-sm text-muted-foreground">
                  Content for item {i + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">End of Demo</h2>
        <p className="text-muted-foreground mb-8">
          You've reached the end of the smooth scroll demo.
        </p>
        <Button 
          onClick={() => scrollTo(0)}
          size="lg"
        >
          Back to Top
        </Button>
      </div>
    </div>
  );
}

// Main demo component with providers
export function SmoothScrollDemo() {
  return (
    <AnimationProvider initialPreset="standard">
      <SmoothScrollProvider className="bg-background">
        <ScrollContent />
      </SmoothScrollProvider>
    </AnimationProvider>
  );
}

export default SmoothScrollDemo;