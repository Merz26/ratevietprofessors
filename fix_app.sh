#!/bin/bash
sed -i '2391,$d' src/App.tsx
cat << 'INNER_EOF' >> src/App.tsx
                          <p className="text-video-title text-text-secondary">{prof.department}</p>
                          {stats.avg_rating > 0 && <p className="text-video-title text-brand-primary">{stats.avg_rating.toFixed(1)} ★</p>}
                        </div>
                      </button>
                      <button type="button" onClick={() => toggleBookmark(id)} className="text-text-tertiary hover:text-danger transition-colors mt-xs shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
INNER_EOF
