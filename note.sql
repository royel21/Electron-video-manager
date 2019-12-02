SELECT
    y.Id,y.Name
    FROM files y
        INNER JOIN (SELECT
                        Name, COUNT(*) AS CountOf
                        FROM files
                        GROUP BY Name
                        HAVING COUNT(*)>1
                    ) dt ON y.Name=dt.Name