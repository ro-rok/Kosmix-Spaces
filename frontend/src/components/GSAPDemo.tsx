import React from 'react';
import ScrollTriggerAnimation, { scrollAnimationPresets } from './ScrollTriggerAnimation';
import StaggerAnimation, { staggerAnimationPresets } from './StaggerAnimation';
import GSAPPerformanceMonitor from './GSAPPerformanceMonitor';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function GSAPDemo() {
  return (
    <div className="space-y-8 p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">GSAP Scroll Animations Demo</h1>
        <p className="text-gray-600">Scroll down to see the animations in action</p>
      </div>

      {/* Individual ScrollTrigger Animations */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Individual Scroll Animations</h2>
        
        <ScrollTriggerAnimation animation={scrollAnimationPresets.fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle>Fade In Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card fades in when it enters the viewport.</p>
            </CardContent>
          </Card>
        </ScrollTriggerAnimation>

        <ScrollTriggerAnimation animation={scrollAnimationPresets.slideUp}>
          <Card>
            <CardHeader>
              <CardTitle>Slide Up Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card slides up from below when it enters the viewport.</p>
            </CardContent>
          </Card>
        </ScrollTriggerAnimation>

        <ScrollTriggerAnimation animation={scrollAnimationPresets.scaleIn}>
          <Card>
            <CardHeader>
              <CardTitle>Scale In Animation</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card scales in when it enters the viewport.</p>
            </CardContent>
          </Card>
        </ScrollTriggerAnimation>
      </section>

      {/* Staggered Animations */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Staggered Animations</h2>
        
        <StaggerAnimation 
          stagger={0.1} 
          animation={staggerAnimationPresets.fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p>First card in staggered animation.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Second card in staggered animation.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Third card in staggered animation.</p>
            </CardContent>
          </Card>
        </StaggerAnimation>
      </section>

      {/* Different Stagger Directions */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Stagger from Center</h2>
        
        <StaggerAnimation 
          stagger={0.15} 
          from="center"
          animation={staggerAnimationPresets.scaleIn}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{i + 1}</span>
                </div>
                <p className="text-sm">Item {i + 1}</p>
              </CardContent>
            </Card>
          ))}
        </StaggerAnimation>
      </section>

      {/* Scrub Animation */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Scrub Animation (Scroll-linked)</h2>
        
        <ScrollTriggerAnimation 
          animation={{
            rotation: 360,
            scale: 1.2,
            duration: 1,
          }}
          scrub={true}
          start="top 80%"
          end="bottom 20%"
        >
          <Card className="mx-auto max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4"></div>
              <p>This element rotates and scales as you scroll!</p>
            </CardContent>
          </Card>
        </ScrollTriggerAnimation>
      </section>

      {/* Performance Monitor (Development only) */}
      <GSAPPerformanceMonitor />

      {/* Spacer for scrolling */}
      <div className="h-96"></div>
    </div>
  );
}

export default GSAPDemo;