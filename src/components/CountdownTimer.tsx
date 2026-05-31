import React from 'react';
import CountUp from 'react-countup';

interface CountdownTimerProps {
  countdown: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ countdown }) => {
  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        <div className="countdown-label">Starting in</div>
        <div className="countdown-number">
          <CountUp
            start={countdown + 1}
            end={countdown}
            duration={1}
            decimals={0}
          />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
