import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { githubApi } from '@/lib/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { GitCommit, GitPullRequest, Star, GitFork } from 'lucide-react';

interface TimelineProps {
  username: string;
}

export function GithubTimeline({ username }: TimelineProps) {
  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['timeline', username],
    queryFn: async () => {
      const [repos, user] = await Promise.all([
        githubApi.getRepos(username),
        githubApi.getUser(username),
      ]);

      // Sort repositories by creation date
      const sortedRepos = repos.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Create timeline events
      const events = sortedRepos.map(repo => ({
        type: 'repository',
        date: repo.created_at,
        title: `Created ${repo.name}`,
        description: repo.description || 'No description provided',
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      }));

      return {
        events,
        firstContribution: user.created_at,
      };
    },
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!timelineData?.events.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No timeline data available
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <CardTitle>GitHub Journey Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary/20" />

          {/* Timeline events */}
          <div className="space-y-8">
            {timelineData.events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
              >
                {/* Event dot */}
                <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-primary transform -translate-x-1/2" />

                <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <GitCommit className="h-4 w-4" />
                          {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {event.language && (
                            <span className="text-primary">{event.language}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {event.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="h-4 w-4" />
                            {event.forks}
                          </span>
                        </div>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </time>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}