import React from 'react';

const TextLogo = ({ size = 'medium', color = '#6366f1' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return '1.5rem';
      case 'large':
        return '2.5rem';
      case 'medium':
      default:
        return '2rem';
    }
  };

  const styles = {
    container: {
      display: 'inline-block',
      textAlign: 'center'
    },
    logo: {
      fontWeight: 700,
      color: color,
      fontSize: getSize(),
      margin: 0,
      fontFamily: "'Inter', sans-serif"
    },
    dot: {
      color: '#111827'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.logo}>
        Zencia<span style={styles.dot}>.</span>
      </h1>
    </div>
  );
};

export default TextLogo;