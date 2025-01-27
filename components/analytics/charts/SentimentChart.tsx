import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SentimentChartProps {
  reviews: Array<{
    content: {
      rating: number;
    };
    metadata: {
      originalCreatedAt: string;
    };
  }>;
}

export function SentimentChart({ reviews }: SentimentChartProps) {
  // Ordina le recensioni per data
  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(a.metadata.originalCreatedAt).getTime() - new Date(b.metadata.originalCreatedAt).getTime()
  );

  // Prepara i dati per il grafico
  const data = sortedReviews.map(review => ({
    date: new Date(review.metadata.originalCreatedAt).toLocaleDateString(),
    rating: review.content.rating
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="rating" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }}
            name="Valutazione"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 