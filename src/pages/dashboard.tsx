import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Users, Star, GitFork, Code, ExternalLink, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { githubApi } from '@/lib/github';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ContributorStats } from '@/components/contributor-stats';
import { RepoSummary } from '@/components/repo-summary';
import { GithubTimeline } from '@/components/github-timeline';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
];

function CommitHeatmap({ username, repo }: { username: string; repo: string }) {
  const { data: commitActivity } = useQuery({
    queryKey: ['commit-activity', username, repo],
    queryFn: () => githubApi.getCommitActivity(username, repo),
    enabled: !!username && !!repo,
  });

  if (!commitActivity || !Array.isArray(commitActivity) || commitActivity.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No commit activity data available
      </div>
    );
  }

  const heatmapData = commitActivity.flatMap((week) => 
    week.days.map((count, dayIndex) => ({
      count,
      day: dayIndex,
      week: week.week,
    }))
  );

  return (
    <div className="grid grid-cols-7 gap-1">
      {heatmapData.map((day, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-sm ${
            day.count === 0
              ? 'bg-secondary'
              : day.count < 5
              ? 'bg-primary/30'
              : day.count < 10
              ? 'bg-primary/60'
              : 'bg-primary'
          }`}
          title={`${day.count} commits`}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { username } = useParams<{ username: string }>();
  const [sortBy, setSortBy] = useState<'stars' | 'forks' | 'updated'>('stars');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user', username],
    queryFn: () => githubApi.getUser(username!),
    enabled: !!username,
    retry: 1,
  });

  const { data: repos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ['repos', username],
    queryFn: () => githubApi.getRepos(username!),
    enabled: !!username && !userError,
  });

  useEffect(() => {
    if (repos && repos.length > 0) {
      setSelectedRepo(repos[0].name);
    }
  }, [repos]);

  if (isLoadingUser || isLoadingRepos) {
    return (
      <div className="min-h-screen grid-pattern flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-lg text-muted-foreground">Analyzing GitHub profile...</p>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen grid-pattern flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">Please check the username and try again.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Process repository data
  const sortedRepos = [...(repos || [])].sort((a, b) => {
    switch (sortBy) {
      case 'stars':
        return b.stargazers_count - a.stargazers_count;
      case 'forks':
        return b.forks_count - a.forks_count;
      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default:
        return 0;
    }
  });

  // Filter repositories based on search query
  const filteredRepos = sortedRepos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Calculate language distribution
  const languageStats = (repos || []).reduce((acc, repo) => {
    if (repo.language) {
      acc[repo.language] = (acc[repo.language] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const languageData = Object.entries(languageStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="min-h-screen grid-pattern">
      <div className="main-container px-4 py-8">
        {/* Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="col-span-1 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  <AvatarImage src={user.avatar_url} alt={username} />
                  <AvatarFallback>{username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-bold gradient-text">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.login}</p>
                </div>
                <p className="text-sm text-center">{user.bio}</p>
                <div className="flex space-x-8 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-xl">{user.followers.toLocaleString()}</p>
                    <p className="text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-xl">{user.following.toLocaleString()}</p>
                    <p className="text-muted-foreground">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-xl">{user.public_repos.toLocaleString()}</p>
                    <p className="text-muted-foreground">Repos</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-primary/20 hover:bg-primary/10"
                  onClick={() => window.open(user.html_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Repository Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sortedRepos.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="name"
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
                    <Line
                      type="monotone"
                      dataKey="stargazers_count"
                      name="Stars"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="forks_count"
                      name="Forks"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Language Distribution and Commit Heatmap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {languageData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle>Commit Activity</CardTitle>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  {sortedRepos.map((repo) => (
                    <SelectItem key={repo.name} value={repo.name}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedRepo && (
                  <CommitHeatmap username={username!} repo={selectedRepo} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repository Summary */}
        {selectedRepo && (
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 mb-8">
            <CardHeader>
              <CardTitle>Repository Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RepoSummary username={username!} repo={selectedRepo} />
              <ContributorStats username={username!} repo={selectedRepo} />
            </CardContent>
          </Card>
        )}

        {/* GitHub Timeline */}
        <div className="mb-8">
          <GithubTimeline username={username!} />
        </div>

        {/* Repositories */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Repositories</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stars">Stars</SelectItem>
                  <SelectItem value="forks">Forks</SelectItem>
                  <SelectItem value="updated">Last Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-4 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex-1">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:text-primary flex items-center"
                    >
                      {repo.name}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {repo.description || 'No description provided'}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      {repo.language && (
                        <span className="flex items-center text-primary">
                          <Code className="h-4 w-4 mr-1" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {repo.stargazers_count.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <GitFork className="h-4 w-4 mr-1" />
                        {repo.forks_count.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        Updated {format(new Date(repo.updated_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}