<template>
  <div class="pastel-dots" :class="variant">
    <div 
      v-for="dot in dots" 
      :key="dot.id" 
      class="dot"
      :style="dot.style"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'PastelDots',
  props: {
    variant: {
      type: String,
      default: 'default', // default, subtle, scattered, border
      validator: (val) => ['default', 'subtle', 'scattered', 'border'].includes(val)
    },
    dotCount: {
      type: Number,
      default: 20
    },
    colors: {
      type: Array,
      default: () => [
        '#B8D4B8', // verde pastel
        '#D4B8D4', // roxo pastel
        '#D4D4B8', // amarelo pastel
        '#B8D4D4', // azul pastel
        '#D4C4B8'  // bege pastel
      ]
    }
  },
  computed: {
    dots() {
      const dotsArray = [];
      for (let i = 0; i < this.dotCount; i++) {
        dotsArray.push({
          id: i,
          style: this.getDotStyle(i)
        });
      }
      return dotsArray;
    }
  },
  methods: {
    // Função pseudo-aleatória determinística baseada no índice
    pseudoRandom(seed) {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    },
    
    getDotStyle(index) {
      const size = this.getDotSize(index);
      const opacity = this.getOpacity(index);
      const color = this.colors[index % this.colors.length];
      
      // Usar pseudo-aleatório determinístico para posições consistentes
      const leftPercent = this.pseudoRandom(index * 7.3) * 100;
      const topPercent = this.pseudoRandom(index * 11.7) * 100;
      
      return {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        opacity: opacity,
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        animationDelay: `${index * 0.15}s`
      };
    },
    
    getDotSize(index) {
      // Variar tamanho dos pontos de forma determinística
      const baseSize = 4;
      const variation = Math.sin(index * 1.5) * 2.5;
      return Math.max(2, baseSize + variation);
    },
    
    getOpacity(index) {
      // Variar opacidade para criar profundidade
      const baseOpacity = 0.25;
      const variation = (Math.sin(index * 0.8) + 1) / 2 * 0.2;
      return baseOpacity + variation;
    }
  }
}
</script>

<style scoped>
.pastel-dots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.pastel-dots.subtle {
  opacity: 0.25;
}

.pastel-dots.scattered .dot {
  animation: float 20s ease-in-out infinite;
}

.pastel-dots.border {
  border-radius: 12px;
  overflow: hidden;
}

.dot {
  position: absolute;
  border-radius: 50%;
  animation: gentlePulse 10s ease-in-out infinite;
  filter: blur(0.5px);
}

.pastel-dots.subtle .dot {
  animation: gentlePulse 12s ease-in-out infinite;
}

.pastel-dots.scattered .dot {
  filter: blur(0.8px);
}

@keyframes gentlePulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.25;
  }
  25% {
    transform: translate(15px, -15px) scale(1.2) rotate(90deg);
    opacity: 0.35;
  }
  50% {
    transform: translate(-10px, 10px) scale(0.9) rotate(180deg);
    opacity: 0.3;
  }
  75% {
    transform: translate(-15px, -10px) scale(1.1) rotate(270deg);
    opacity: 0.35;
  }
}
</style>

