import { motion } from 'framer-motion';
import { MapPin, Clock, DollarSign, Utensils, Lightbulb, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Itinerary, ItineraryDay } from '@/types/travel';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
}

export function ItineraryDisplay({ itinerary }: ItineraryDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Summary Card */}
      <Card className="overflow-hidden border-none shadow-card">
        <div className="bg-gradient-to-r from-primary to-[hsl(340,80%,55%)] p-6 text-primary-foreground">
          <h2 className="text-2xl font-bold mb-2">{itinerary.destination}</h2>
          <p className="opacity-90">{itinerary.summary}</p>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Accommodation</p>
              <p className="text-lg font-semibold">${itinerary.estimatedBudget.accommodation}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Food</p>
              <p className="text-lg font-semibold">${itinerary.estimatedBudget.food}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Activities</p>
              <p className="text-lg font-semibold">${itinerary.estimatedBudget.activities}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Transport</p>
              <p className="text-lg font-semibold">${itinerary.estimatedBudget.transport}</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-primary/10 rounded-xl">
            <p className="text-center">
              <span className="text-muted-foreground">Total Estimated Budget: </span>
              <span className="text-2xl font-bold text-primary">${itinerary.estimatedBudget.total}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-none shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-accent" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {itinerary.tips.map((tip, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg"
              >
                <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm">{tip}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Daily Itinerary */}
      <div className="space-y-6">
        {itinerary.days.map((day, dayIndex) => (
          <DayCard key={dayIndex} day={day} dayIndex={dayIndex} />
        ))}
      </div>
    </motion.div>
  );
}

function DayCard({ day, dayIndex }: { day: ItineraryDay; dayIndex: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.1 }}
    >
      <Card className="border-none shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted to-background pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {day.day}
              </div>
              <div>
                <p className="text-lg font-semibold">{day.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {day.date}
                </p>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Activities */}
          <div className="space-y-4">
            {day.activities.map((activity, actIndex) => (
              <motion.div
                key={actIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: actIndex * 0.05 }}
                className="flex gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="text-center shrink-0">
                  <Badge variant="outline" className="font-mono">
                    {activity.time}
                  </Badge>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ~${activity.estimatedCost}
                    </span>
                  </div>
                  {activity.tips && (
                    <p className="text-xs text-accent italic mt-2">💡 {activity.tips}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Meals */}
          {day.meals.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                Recommended Dining
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                {day.meals.map((meal, mealIndex) => (
                  <div
                    key={mealIndex}
                    className="p-3 bg-secondary/50 rounded-lg"
                  >
                    <Badge className="mb-2 capitalize">{meal.type}</Badge>
                    <p className="font-medium text-sm">{meal.restaurant}</p>
                    <p className="text-xs text-muted-foreground">{meal.cuisine} • {meal.priceRange}</p>
                    <p className="text-xs mt-1 text-accent">Try: {meal.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
