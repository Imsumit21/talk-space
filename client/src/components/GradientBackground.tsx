export const GradientBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <div
        className="w-full h-full gradient-mesh-animate"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
            #1e1b4b
          `,
          backgroundSize: '200% 200%',
        }}
      />
    </div>
  );
};
