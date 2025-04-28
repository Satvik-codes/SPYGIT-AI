import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { githubApi } from '@/lib/github';
import type { Contributor } from '@/lib/github';

interface ContributorStatsProps {
  username: string;
  repo: string;
}

export function ContributorStats({ username, repo }: ContributorStatsProps) {
  const { data: contributors, isLoading } = useQuery({
    queryKey: ['contributors', username, repo],
    queryFn: () => githubApi.getContributors(username, repo),
    enabled: !!username && !!repo,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!contributors || contributors.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No contributor data available
      </div>
    );
  }

  const sortedContributors = [...contributors];
  const mostActive = sortedContributors[0];
  const leastActive = sortedContributors[sortedContributors.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Most Active Contributor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={mostActive.avatar_url} alt={mostActive.login} />
                <AvatarFallback>{mostActive.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{mostActive.login}</div>
                <div className="text-sm text-muted-foreground">
                  {mostActive.total_commits?.toLocaleString() || mostActive.contributions.toLocaleString()} total commits
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Least Active Contributor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarImage src={leastActive.avatar_url} alt={leastActive.login} />
                <AvatarFallback>{leastActive.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{leastActive.login}</div>
                <div className="text-sm text-muted-foreground">
                  {leastActive.total_commits?.toLocaleString() || leastActive.contributions.toLocaleString()} total commits
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedContributors.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="login"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Bar
              dataKey="total_commits"
              fill="hsl(var(--primary))"
              name="Total Commits"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {sortedContributors.map((contributor: Contributor) => (
          <a
            key={contributor.login}
            href={contributor.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-4 p-4 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
          >
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
              <AvatarFallback>{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{contributor.login}</div>
              <div className="text-sm text-muted-foreground">
                {contributor.total_commits?.toLocaleString() || contributor.contributions.toLocaleString()} total commits
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}